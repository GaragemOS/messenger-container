// Rota server-to-server (autenticada por API key) que cunha um embed token
// efemero e escopado. O escopo solicitado e validado contra o escopo da chave.
import type { FastifyInstance } from "fastify";
import { requireApiKey } from "../middleware/apikey.ts";
import { scopeContains, type EmbedScope } from "../../embed/scope.ts";
import { mintEmbedToken } from "../../embed/token.ts";
import { loadPrivateKey } from "../../embed/token-keys.ts";
import { getProduct } from "../../apikeys/products.repo.ts";
import { config } from "../../config/index.ts";

const CLASSES = ["templates", "flows", "metrics", "multitenant"];

export async function embedRoutes(app: FastifyInstance): Promise<void> {
  app.post("/embed/token", { preHandler: requireApiKey }, async (req, reply) => {
    const body = (req.body ?? {}) as { class?: string; session?: string; scope?: Partial<EmbedScope> };
    const cls = body.class ?? "";
    if (!CLASSES.includes(cls)) {
      reply.code(400);
      return { error: "class invalida (use templates, flows, metrics ou multitenant)" };
    }
    const apiKey = req.apiKey!;
    const requested: EmbedScope = {
      classes: [cls],
      client_companies: body.scope?.client_companies ?? ["*"],
      phone_numbers: body.scope?.phone_numbers ?? ["*"],
    };
    if (!scopeContains(apiKey.scopes, requested)) {
      reply.code(403);
      return { error: "escopo solicitado fora do permitido pela chave" };
    }
    const product = await getProduct(apiKey.productId);
    const token = await mintEmbedToken(await loadPrivateKey(), {
      productId: apiKey.productId,
      cls,
      scope: requested,
      audience: product?.allowed_origins ?? [],
      ttlSeconds: config.embed.tokenTtlSeconds,
      ...(body.session ? { session: body.session } : {}),
    });
    return { embed_token: token, expires_in: config.embed.tokenTtlSeconds, class: cls };
  });
}
