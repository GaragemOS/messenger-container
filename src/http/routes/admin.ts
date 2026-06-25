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
}
