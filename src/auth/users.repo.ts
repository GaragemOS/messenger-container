// Acesso a tabela users (console interno).
import { query } from "../db/pool.ts";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  status: string;
  failed_logins: number;
  locked_until: Date | null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const r = await query<UserRow>(
    "SELECT id, email, password_hash, status, failed_logins, locked_until FROM users WHERE email = $1",
    [email],
  );
  return r.rows[0] ?? null;
}

// Garante a existencia do usuario (estado pending) ao solicitar codigo.
export async function upsertPendingUser(email: string): Promise<void> {
  await query(
    `INSERT INTO users (email) VALUES ($1)
     ON CONFLICT (email) DO NOTHING`,
    [email],
  );
}

export async function setUserPassword(email: string, passwordHash: string): Promise<void> {
  await query(
    `UPDATE users SET password_hash = $2, status = 'active', failed_logins = 0, locked_until = NULL
     WHERE email = $1`,
    [email, passwordHash],
  );
}

export async function recordLoginSuccess(id: string): Promise<void> {
  await query(
    "UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = now() WHERE id = $1",
    [id],
  );
}

// Incrementa falhas e bloqueia por 15 min ao atingir 5 falhas consecutivas.
export async function recordLoginFailure(id: string): Promise<void> {
  await query(
    `UPDATE users SET
       failed_logins = failed_logins + 1,
       locked_until = CASE WHEN failed_logins + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
     WHERE id = $1`,
    [id],
  );
}
