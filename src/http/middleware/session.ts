// preHandler que exige uma sessao de console valida (cookie __Host-session).
import type { FastifyReply, FastifyRequest } from "fastify";
import { readSessionCookie } from "../cookies.ts";
import { hashSessionToken } from "../../auth/session.ts";
import { findSessionUser } from "../../auth/sessions.repo.ts";

declare module "fastify" {
  interface FastifyRequest {
    sessionUser?: { user_id: string; email: string };
  }
}

export async function requireSession(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = readSessionCookie(req.headers.cookie);
  const su = token ? await findSessionUser(hashSessionToken(token)) : null;
  if (!su) {
    await reply.code(401).send({ error: "nao autenticado" });
    return;
  }
  req.sessionUser = su;
}
