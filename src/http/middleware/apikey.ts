// preHandler que autentica a requisicao por API key (Authorization: Bearer mc_...).
import type { FastifyReply, FastifyRequest } from "fastify";
import { parseApiKey, verifySecret } from "../../apikeys/keys.ts";
import { findActiveByKeyId, touchLastUsed } from "../../apikeys/keys.repo.ts";
import type { EmbedScope } from "../../embed/scope.ts";

declare module "fastify" {
  interface FastifyRequest {
    apiKey?: { id: string; productId: string; scopes: EmbedScope };
  }
}

export async function requireApiKey(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = req.headers.authorization;
  const full = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const parsed = full ? parseApiKey(full) : null;
  if (!parsed) {
    await reply.code(401).send({ error: "api key ausente ou malformada" });
    return;
  }
  const key = await findActiveByKeyId(parsed.keyId);
  if (!key || !verifySecret(parsed.secret, key.secret_hash)) {
    await reply.code(401).send({ error: "api key invalida" });
    return;
  }
  void touchLastUsed(key.id);
  req.apiKey = { id: key.id, productId: key.product_id, scopes: key.scopes };
}
