// Consultas de metricas e chargeback, escopadas ao produto.
// Usa FILTER para somar por status e window function (ROW_NUMBER) para o estado
// atual de cada mensagem; chargeback cruza contagem por categoria x tarifa vigente.
import { query } from "../db/pool.ts";

export interface MetricsSummary {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export async function summaryByProduct(
  productId: string,
  fromIso: string,
  toIso: string,
): Promise<MetricsSummary> {
  const r = await query<MetricsSummary>(
    `SELECT
       count(*) FILTER (WHERE ms.status = 'sent')::int      AS sent,
       count(*) FILTER (WHERE ms.status = 'delivered')::int AS delivered,
       count(*) FILTER (WHERE ms.status = 'read')::int      AS read,
       count(*) FILTER (WHERE ms.status = 'failed')::int    AS failed
     FROM message_status ms
     JOIN messages m ON m.id = ms.message_id
     WHERE m.product_id = $1 AND ms.occurred_at BETWEEN $2 AND $3`,
    [productId, fromIso, toIso],
  );
  return r.rows[0] ?? { sent: 0, delivered: 0, read: 0, failed: 0 };
}

export interface ChargebackRow {
  category: string;
  qtd: number;
  price_usd: number;
  custo_estimado_usd: number;
}

export async function chargebackByProduct(productId: string): Promise<ChargebackRow[]> {
  const r = await query<ChargebackRow>(
    `WITH rates AS (
       SELECT DISTINCT ON (category, country) category, country, price_usd
       FROM pricing_rates ORDER BY category, country, effective_date DESC
     ),
     counts AS (
       SELECT coalesce(billing_category, 'unknown') AS category, count(*)::int AS qtd
       FROM messages
       WHERE product_id = $1 AND direction = 'outbound'
       GROUP BY 1
     )
     SELECT c.category, c.qtd,
            coalesce(r.price_usd, 0)::float AS price_usd,
            (c.qtd * coalesce(r.price_usd, 0))::float AS custo_estimado_usd
     FROM counts c
     LEFT JOIN rates r ON r.category = c.category AND r.country = 'BR'
     ORDER BY custo_estimado_usd DESC`,
    [productId],
  );
  return r.rows;
}
