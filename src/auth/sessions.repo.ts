// Acesso a tabela sessions (sessoes opacas do console).
import { query } from "../db/pool.ts";

export async function createSession(
  userId: string,
  tokenHash: string,
  ip: string | null,
  userAgent: string | null,
  ttlDays = 7,
): Promise<void> {
  await query(
    `INSERT INTO sessions (user_id, token_hash, ip, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, now() + ($5 || ' days')::interval)`,
    [userId, tokenHash, ip, userAgent, String(ttlDays)],
  );
}

export interface SessionUser {
  user_id: string;
  email: string;
}

// Retorna o usuario da sessao valida e atualiza last_seen_at.
export async function findSessionUser(tokenHash: string): Promise<SessionUser | null> {
  const r = await query<SessionUser>(
    `SELECT s.user_id, u.email FROM sessions s
       JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`,
    [tokenHash],
  );
  const row = r.rows[0];
  if (row) {
    await query("UPDATE sessions SET last_seen_at = now() WHERE token_hash = $1", [tokenHash]);
  }
  return row ?? null;
}

export async function revokeSession(tokenHash: string): Promise<void> {
  await query("UPDATE sessions SET revoked_at = now() WHERE token_hash = $1", [tokenHash]);
}
