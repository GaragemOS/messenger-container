// preHandler que valida o embed token (JWT EdDSA) das chamadas feitas pela tela.
import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyEmbedToken } from "../../embed/token.ts";
import { loadPublicKey } from "../../embed/token-keys.ts";
import type { EmbedScope } from "../../embed/scope.ts";

declare module "fastify" {
  interface FastifyRequest {
    embed?: { product: string; cls: string; scope: EmbedScope; session?: string };
  }
}

export async function requireEmbedToken(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    await reply.code(401).send({ error: "embed token ausente" });
    return;
  }
  try {
    const claims = await verifyEmbedToken(await loadPublicKey(), token);
    req.embed = {
      product: claims.prd,
      cls: claims.cls,
      scope: claims.scp,
      ...(claims.sess ? { session: claims.sess } : {}),
    };
  } catch {
    await reply.code(401).send({ error: "embed token invalido ou expirado" });
  }
}
