// Servidor HTTP (Fastify). No v1 expoe apenas health checks; rotas de auth,
// API keys, embed e WhatsApp sao registradas nas fases seguintes.
import Fastify, { type FastifyInstance } from "fastify";
import { pool } from "../db/pool.ts";

export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    trustProxy: true,
  });

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
