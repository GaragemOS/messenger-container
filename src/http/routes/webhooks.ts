// Rotas de webhook do WhatsApp.
// GET: handshake de verificacao (ecoa hub.challenge).
// POST: valida a assinatura sobre o corpo bruto, responde 200 rapido e processa
// de forma assincrona com idempotencia.
import type { FastifyInstance, FastifyRequest } from "fastify";
import { config } from "../../config/index.ts";
import { verifySignature } from "../../whatsapp/signature.ts";
import { extractEvents } from "../../whatsapp/webhooks.ts";
import { recordWebhookEvent, markProcessed } from "../../whatsapp/webhook-store.ts";

type RawRequest = FastifyRequest & { rawBody?: Buffer };

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // Preserva o corpo bruto (necessario para validar a assinatura antes do parse).
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (req, body, done) => {
    (req as RawRequest).rawBody = body as Buffer;
    try {
      const buf = body as Buffer;
      done(null, buf.length ? JSON.parse(buf.toString("utf8")) : {});
    } catch (err) {
      done(err as Error);
    }
  });

  app.get("/webhooks/whatsapp", async (req, reply) => {
    const q = req.query as Record<string, string>;
    const token = q["hub.verify_token"];
    if (
      q["hub.mode"] === "subscribe" &&
      config.whatsapp.webhookVerifyToken &&
      token === config.whatsapp.webhookVerifyToken
    ) {
      reply.type("text/plain; charset=utf-8");
      return q["hub.challenge"] ?? "";
    }
    reply.code(403).type("text/plain; charset=utf-8");
    return "forbidden";
  });

  app.post("/webhooks/whatsapp", async (req, reply) => {
    const raw = (req as RawRequest).rawBody ?? Buffer.from("");
    const sig = req.headers["x-hub-signature-256"];
    if (!verifySignature(raw, typeof sig === "string" ? sig : undefined, config.whatsapp.appSecret)) {
      reply.code(401);
      return { error: "assinatura invalida" };
    }
    // Responde 200 rapido; processa de forma assincrona.
    reply.code(200).send({ received: true });
    void handleAsync(raw, req.body, req).catch((err) => req.log.error({ err }, "falha ao processar webhook"));
  });

  async function handleAsync(raw: Buffer, body: unknown, req: FastifyRequest): Promise<void> {
    const isNew = await recordWebhookEvent(raw);
    if (!isNew) return;
    try {
      const events = extractEvents(body);
      req.log.info({ count: events.length }, "webhook processado");
      // Persistencia de mensagens/status entra na fase 5.
      await markProcessed(raw, "processed");
    } catch {
      await markProcessed(raw, "failed");
    }
  }
}
