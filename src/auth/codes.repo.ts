// Acesso a tabela email_verification_codes.
import { query } from "../db/pool.ts";

// Invalida codigos anteriores nao usados e grava o novo (hash) com TTL.
export async function storeCode(
  email: string,
  codeHash: string,
  purpose: string,
  ttlMinutes = 10,
): Promise<void> {
  await query(
    "UPDATE email_verification_codes SET consumed_at = now() WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL",
    [email, purpose],
  );
  await query(
    `INSERT INTO email_verification_codes (email, code_hash, purpose, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' minutes')::interval)`,
    [email, codeHash, purpose, String(ttlMinutes)],
  );
}

export interface CodeRow {
  id: string;
  code_hash: string;
  attempts: number;
}

export async function findActiveCode(email: string, purpose: string): Promise<CodeRow | null> {
  const r = await query<CodeRow>(
    `SELECT id, code_hash, attempts FROM email_verification_codes
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose],
  );
  return r.rows[0] ?? null;
}

export async function incrementAttempts(id: string): Promise<void> {
  await query("UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = $1", [id]);
}

export async function consumeCode(id: string): Promise<void> {
  await query("UPDATE email_verification_codes SET consumed_at = now() WHERE id = $1", [id]);
}
