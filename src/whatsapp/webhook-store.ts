// Idempotencia de webhooks: registra o hash do corpo bruto e indica se o evento
// e novo (deve ser processado) ou ja foi visto.
import { createHash } from "node:crypto";
import { query } from "../db/pool.ts";

export function hashBody(raw: Buffer | string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function recordWebhookEvent(raw: Buffer | string): Promise<boolean> {
  const r = await query<{ id: string }>(
    "INSERT INTO webhook_events (event_hash) VALUES ($1) ON CONFLICT (event_hash) DO NOTHING RETURNING id",
    [hashBody(raw)],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function markProcessed(raw: Buffer | string, status: "processed" | "failed"): Promise<void> {
  await query(
    "UPDATE webhook_events SET status = $2, processed_at = now() WHERE event_hash = $1",
    [hashBody(raw), status],
  );
}
