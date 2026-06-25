// Acesso a tabela flows, escopado ao produto.
import { query } from "../db/pool.ts";

export interface FlowRow {
  id: string;
  waba_id: string | null;
  name: string;
  status: string;
}

export async function createFlow(input: {
  productId: string;
  wabaId: string | null;
  name: string;
  flowJson: unknown;
}): Promise<FlowRow> {
  const r = await query<FlowRow>(
    `INSERT INTO flows (product_id, waba_id, name, flow_json) VALUES ($1, $2, $3, $4)
     RETURNING id, waba_id, name, status`,
    [input.productId, input.wabaId, input.name, JSON.stringify(input.flowJson ?? {})],
  );
  return r.rows[0]!;
}

export async function listFlows(productId: string): Promise<FlowRow[]> {
  const r = await query<FlowRow>(
    "SELECT id, waba_id, name, status FROM flows WHERE product_id = $1 ORDER BY created_at DESC",
    [productId],
  );
  return r.rows;
}

export async function getFlow(productId: string, id: string): Promise<FlowRow | null> {
  const r = await query<FlowRow>(
    "SELECT id, waba_id, name, status FROM flows WHERE id = $1 AND product_id = $2",
    [id, productId],
  );
  return r.rows[0] ?? null;
}

export async function updateFlowStatus(productId: string, id: string, status: string): Promise<void> {
  await query("UPDATE flows SET status = $3 WHERE id = $1 AND product_id = $2", [id, productId, status]);
}
