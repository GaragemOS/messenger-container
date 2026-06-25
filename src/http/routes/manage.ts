// Rotas de gestao (autenticadas por API key) para o backend dos produtos:
// onboarding multitenant (empresas/WABAs/numeros) e CRUD de templates/flows.
import type { FastifyInstance } from "fastify";
import { requireApiKey } from "../middleware/apikey.ts";
import * as tenants from "../../tenants/tenants.repo.ts";
import * as templatesRepo from "../../templates/templates.repo.ts";
import * as flowsRepo from "../../flows/flows.repo.ts";
import { validateTemplateInput } from "../../templates/template-validate.ts";
import { summaryByProduct, chargebackByProduct } from "../../metrics/metrics.repo.ts";
import { normalizeWithFallback } from "../../normalizer/fallback.ts";

export async function manageRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireApiKey);

  app.post("/v1/tenants", async (req, reply) => {
    const { name, external_ref } = (req.body ?? {}) as { name?: string; external_ref?: string };
    if (!name) {
      reply.code(400);
      return { error: "name obrigatorio" };
    }
    return tenants.createCompany(req.apiKey!.productId, name, external_ref ?? null);
  });

  app.get("/v1/tenants", async (req) => ({
    tenants: await tenants.listCompanies(req.apiKey!.productId, ["*"]),
  }));

  app.post("/v1/tenants/:id/wabas", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { waba_id_meta, name } = (req.body ?? {}) as { waba_id_meta?: string; name?: string };
    if (!(await tenants.getCompany(req.apiKey!.productId, id))) {
      reply.code(404);
      return { error: "empresa nao encontrada" };
    }
    if (!waba_id_meta) {
      reply.code(400);
      return { error: "waba_id_meta obrigatorio" };
    }
    return tenants.createWaba(id, waba_id_meta, name ?? null);
  });

  app.post("/v1/wabas/:id/numbers", async (req, reply) => {
    const { id } = req.params as { id: string };
    const b = (req.body ?? {}) as { phone_number_id_meta?: string; display_phone?: string; display_name?: string };
    const wc = await tenants.getWabaCompany(req.apiKey!.productId, id);
    if (!wc) {
      reply.code(404);
      return { error: "waba nao encontrada" };
    }
    if (!b.phone_number_id_meta) {
      reply.code(400);
      return { error: "phone_number_id_meta obrigatorio" };
    }
    return tenants.createNumber({
      wabaId: id,
      companyId: wc.company_id,
      phoneNumberIdMeta: b.phone_number_id_meta,
      displayPhone: b.display_phone ?? null,
      displayName: b.display_name ?? null,
    });
  });

  app.post("/v1/templates", async (req, reply) => {
    const b = (req.body ?? {}) as {
      waba_id?: string; name?: string; language?: string; category?: string;
      components?: unknown; variables?: Array<{ index: number; example?: string }>;
    };
    if (!b.waba_id) {
      reply.code(400);
      return { error: "waba_id obrigatorio" };
    }
    if (!(await tenants.getWabaCompany(req.apiKey!.productId, b.waba_id))) {
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
      wabaId: b.waba_id, productId: req.apiKey!.productId, name: b.name!,
      language: b.language ?? "pt_BR", category: b.category!, components: b.components, variables: b.variables ?? [],
    });
  });

  app.get("/v1/templates", async (req) => ({
    templates: await templatesRepo.listTemplates(req.apiKey!.productId),
  }));

  app.post("/v1/flows", async (req, reply) => {
    const b = (req.body ?? {}) as { name?: string; waba_id?: string; flow_json?: unknown };
    if (!b.name) {
      reply.code(400);
      return { error: "name obrigatorio" };
    }
    return flowsRepo.createFlow({
      productId: req.apiKey!.productId, wabaId: b.waba_id ?? null, name: b.name, flowJson: b.flow_json ?? {},
    });
  });

  app.get("/v1/flows", async (req) => ({
    flows: await flowsRepo.listFlows(req.apiKey!.productId),
  }));

  app.get("/v1/metrics", async (req) => {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [summary, chargeback] = await Promise.all([
      summaryByProduct(req.apiKey!.productId, from, to),
      chargebackByProduct(req.apiKey!.productId),
    ]);
    return { summary, chargeback, periodo: { from, to } };
  });

  // Normaliza um codigo de erro da Cloud API (deterministico; fallback LLM se habilitado).
  app.get("/v1/normalize/:code", async (req) => {
    const { code } = req.params as { code: string };
    return normalizeWithFallback(code);
  });
}
