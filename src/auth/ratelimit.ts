// Rate-limit de janela fixa baseado em Postgres (sem Redis).
// Retorna true se a requisicao esta dentro do limite.
import { query } from "../db/pool.ts";

export async function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const r = await query<{ allowed: boolean }>(
    `INSERT INTO auth_rate_limits (bucket_key, window_start, count)
       VALUES ($1, now(), 1)
     ON CONFLICT (bucket_key) DO UPDATE SET
       count = CASE
         WHEN auth_rate_limits.window_start < now() - ($3 || ' seconds')::interval THEN 1
         ELSE auth_rate_limits.count + 1 END,
       window_start = CASE
         WHEN auth_rate_limits.window_start < now() - ($3 || ' seconds')::interval THEN now()
         ELSE auth_rate_limits.window_start END
     RETURNING (count <= $2) AS allowed`,
    [bucketKey, limit, String(windowSeconds)],
  );
  return r.rows[0]?.allowed ?? false;
}
