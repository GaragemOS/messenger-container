// Servidor HTTP (Fastify). No v1 expoe apenas health checks; rotas de auth,
// API keys, embed e WhatsApp sao registradas nas fases seguintes.
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { pool } from "../db/pool.ts";
import { authRoutes } from "./routes/auth.ts";
import { adminRoutes } from "./routes/admin.ts";
import { embedRoutes } from "./routes/embed.ts";
import { embedPublicRoutes } from "./routes/embed-public.ts";
import { webhookRoutes } from "./routes/webhooks.ts";
import { CONSOLE_HTML } from "../console/page.ts";

export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    trustProxy: true,
  });

  // Console interno (pagina de login/gestao).
  const serveConsole = async (_req: FastifyRequest, reply: FastifyReply) =>
    reply.type("text/html; charset=utf-8").send(CONSOLE_HTML);
  app.get("/", serveConsole);
  app.get("/console", serveConsole);

  // Rotas de autenticacao, administracao (sessao) e embed (API key).
  app.register(authRoutes);
  app.register(adminRoutes);
  app.register(embedRoutes);
  app.register(embedPublicRoutes);
  app.register(webhookRoutes);

  // Liveness: o processo esta de pe.
  app.get("/healthz", async () => ({
    status: "ok",
    uptime: process.uptime(),
  }));

  // Readiness: dependencias criticas (banco) respondem.
  app.get("/readyz", async (_req, reply) => {
    try {
      await pool.query("SELECT 1");
      return { status: "ready" };
    } catch {
      reply.code(503);
      return { status: "not-ready" };
    }
  });

  return app;
}
