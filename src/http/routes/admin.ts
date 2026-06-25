// Rotas administrativas do console (protegidas por sessao): gestao de produtos
// e API keys. A criacao de chave retorna o secret uma unica vez.
import type { FastifyInstance } from "fastify";
import { requireSession } from "../middleware/session.ts";
import { createProduct, listProducts, getProduct } from "../../apikeys/products.repo.ts";
import { createApiKey, listByProduct, revokeKey } from "../../apikeys/keys.repo.ts";
import { generateApiKey } from "../../apikeys/keys.ts";
import { fullScope } from "../../embed/scope.ts";
import { mintEmbedToken } from "../../embed/token.ts";
import { loadPrivateKey } from "../../embed/token-keys.ts";
import { config } from "../../config/index.ts";
import * as tenants from "../../tenants/tenants.repo.ts";
import * as templatesRepo from "../../templates/templates.repo.ts";
import * as flowsRepo from "../../flows/flows.repo.ts";
import { validateTemplateInput } from "../../templates/template-validate.ts";

const EMBED_CLASSES = ["templates", "flows", "metrics", "multitenant"];

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireSession);

  app.post("/api/products", async (req, reply) => {
    const { name, slug, allowed_origins } = (req.body ?? {}) as {
      name?: string;
      slug?: string;
      allowed_origins?: unknown;
    };
    if (!name || !slug) {
      reply.code(400);
      return { error: "name e slug sao obrigatorios" };
    }
    const origins = Array.isArray(allowed_origins)
      ? allowed_origins.filter((o): o is string => typeof o === "string")
      : [];
    return createProduct(name, slug, origins);
  });

  app.get("/api/products", async () => ({ products: await listProducts() }));

  app.post("/api/products/:id/keys", async (req, reply) => {
    const { id } = req.params as { id: string };
    const product = await getProduct(id);
    if (!product) {
      reply.code(404);
      return { error: "produto nao encontrado" };
    }
    const gen = generateApiKey("live");
    const scopes = fullScope();
    await createApiKey({
      productId: id,
      keyId: gen.keyId,
      secretHash: gen.secretHash,
      lastFour: gen.lastFour,
      environment: "live",
      scopes,
      createdBy: req.sessionUser?.user_id ?? null,
    });
    return {
      key: gen.full,
      key_id: gen.keyId,
      last_four: gen.lastFour,
      scopes,
      note: "guarde a chave: ela nao sera exibida novamente",
    };
  });

  app.get("/api/products/:id/keys", async (req) => {
    const { id } = req.params as { id: string };
    return { keys: await listByProduct(id) };
  });

  app.post("/api/keys/:id/revoke", async (req) => {
    const { id } = req.params as { id: string };
    await revokeKey(id);
    return { ok: true };
  });

  // Cunha um embed token (escopo total) para o console pre-visualizar as telas.
  app.post("/api/products/:id/embed-token", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { class: cls } = (req.body ?? {}) as { class?: string };
    const product = await getProduct(id);
    if (!product) {
      reply.code(404);
      return { error: "produto nao encontrado" };
    }
    if (!EMBED_CLASSES.includes(cls ?? "")) {
      reply.code(400);
      return { error: "class invalida" };
    }
    const token = await mintEmbedToken(await loadPrivateKey(), {
      productId: id,
      cls: cls!,
      scope: fullScope(),
      audience: product.allowed_origins,
      ttlSeconds: config.embed.tokenTtlSeconds,
    });
    return { embed_token: token };
  });

  // --- Gestao multitenant / templates / flows pela sessao do console ---

  app.get("/api/products/:id/tenants", async (req) => {
    const { id } = req.params as { id: string };
    const [companies, wabas, numbers] = await Promise.all([
      tenants.listCompanies(id, ["*"]),
      tenants.listWabas(id),
      tenants.listNumbers(id, ["*"]),
    ]);
    return { companies, wabas, numbers };
  });

  app.post("/api/products/:id/tenants", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, external_ref } = (req.body ?? {}) as { name?: string; external_ref?: string };
    if (!name) {
      reply.code(400);
      return { error: "name obrigatorio" };
    }
    return tenants.createCompany(id, name, external_ref ?? null);
  });

  app.post("/api/products/:id/tenants/:tid/wabas", async (req, reply) => {
    const { id, tid } = req.params as { id: string; tid: string };
    const { waba_id_meta, name } = (req.body ?? {}) as { waba_id_meta?: string; name?: string };
    if (!(await tenants.getCompany(id, tid))) {
      reply.code(404);
      return { error: "empresa nao encontrada" };
    }
    if (!waba_id_meta) {
      reply.code(400);
      return { error: "waba_id_meta obrigatorio" };
    }
    return tenants.createWaba(tid, waba_id_meta, name ?? null);
  });

  app.post("/api/products/:id/wabas/:wid/numbers", async (req, reply) => {
    const { id, wid } = req.params as { id: string; wid: string };
    const b = (req.body ?? {}) as { phone_number_id_meta?: string; display_phone?: string; display_name?: string };
    const wc = await tenants.getWabaCompany(id, wid);
    if (!wc) {
      reply.code(404);
      return { error: "waba nao encontrada" };
    }
    if (!b.phone_number_id_meta) {
      reply.code(400);
      return { error: "phone_number_id_meta obrigatorio" };
    }
    return tenants.createNumber({
      wabaId: wid,
      companyId: wc.company_id,
      phoneNumberIdMeta: b.phone_number_id_meta,
      displayPhone: b.display_phone ?? null,
      displayName: b.display_name ?? null,
    });
  });

  app.get("/api/products/:id/templates", async (req) => ({
    templates: await templatesRepo.listTemplates((req.params as { id: string }).id),
  }));

  app.post("/api/products/:id/templates", async (req, reply) => {
    const { id } = req.params as { id: string };
    const b = (req.body ?? {}) as {
      waba_id?: string; name?: string; language?: string; category?: string;
      components?: unknown; variables?: Array<{ index: number; example?: string }>;
    };
    if (!b.waba_id) {
      reply.code(400);
      return { error: "waba_id obrigatorio" };
    }
    if (!(await tenants.getWabaCompany(id, b.waba_id))) {
      reply.code(404);
      return { error: "waba nao encontrada" };
    }
    const v = validateTemplateInput({
      name: b.name ?? "", category: b.category ?? "", components: b.components,
      ...(b.variables ? { variables: b.variables } : {}),
    });
    if (!v.ok) {
      reply.code(400);
      return { error: "template invalido", detalhes: v.errors };
    }
    return templatesRepo.createTemplate({
      wabaId: b.waba_id, productId: id, name: b.name!, language: b.language ?? "pt_BR",
      category: b.category!, components: b.components, variables: b.variables ?? [],
    });
  });

  app.get("/api/products/:id/flows", async (req) => ({
    flows: await flowsRepo.listFlows((req.params as { id: string }).id),
  }));

  app.post("/api/products/:id/flows", async (req, reply) => {
    const { id } = req.params as { id: string };
    const b = (req.body ?? {}) as { name?: string; waba_id?: string; flow_json?: unknown };
    if (!b.name) {
      reply.code(400);
      return { error: "name obrigatorio" };
    }
    return flowsRepo.createFlow({
      productId: id, wabaId: b.waba_id ?? null, name: b.name, flowJson: b.flow_json ?? {},
    });
  });

  app.get("/api/products/:id/flows/:fid", async (req, reply) => {
    const { id, fid } = req.params as { id: string; fid: string };
    const flow = await flowsRepo.getFlowDetail(id, fid);
    if (!flow) {
      reply.code(404);
      return { error: "flow nao encontrado" };
    }
    return flow;
  });

  app.post("/api/products/:id/flows/:fid", async (req, reply) => {
    const { id, fid } = req.params as { id: string; fid: string };
    const b = (req.body ?? {}) as { name?: string; flow_json?: unknown };
    if (!b.name) {
      reply.code(400);
      return { error: "name obrigatorio" };
    }
    if (!(await flowsRepo.getFlow(id, fid))) {
      reply.code(404);
      return { error: "flow nao encontrado" };
    }
    await flowsRepo.updateFlow(id, fid, b.name, b.flow_json ?? {});
    return { ok: true };
  });
}
