// Acesso a tabela api_keys. Guardamos sha256(secret); nunca o secret em claro.
import { query } from "../db/pool.ts";
import type { EmbedScope } from "../embed/scope.ts";

export interface ApiKeyRow {
  id: string;
  product_id: string;
  key_id: string;
  secret_hash: string;
  last_four: string;
  environment: string;
  scopes: EmbedScope;
  status: string;
}

export async function createApiKey(input: {
  productId: string;
  keyId: string;
  secretHash: string;
  lastFour: string;
  environment: string;
  scopes: EmbedScope;
  createdBy: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO api_keys (product_id, key_id, secret_hash, last_four, environment, scopes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.productId,
      input.keyId,
      input.secretHash,
      input.lastFour,
      input.environment,
      JSON.stringify(input.scopes),
      input.createdBy,
    ],
  );
}

export async function findActiveByKeyId(keyId: string): Promise<ApiKeyRow | null> {
  const r = await query<ApiKeyRow>(
    `SELECT id, product_id, key_id, secret_hash, last_four, environment, scopes, status
     FROM api_keys
     WHERE key_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > now())`,
    [keyId],
  );
  return r.rows[0] ?? null;
}

export interface ApiKeyPublic {
  id: string;
  key_id: string;
  last_four: string;
  environment: string;
  scopes: EmbedScope;
  status: string;
  created_at: Date;
  last_used_at: Date | null;
}

export async function listByProduct(productId: string): Promise<ApiKeyPublic[]> {
  const r = await query<ApiKeyPublic>(
    `SELECT id, key_id, last_four, environment, scopes, status, created_at, last_used_at
     FROM api_keys WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId],
  );
  return r.rows;
}

export async function revokeKey(id: string): Promise<void> {
  await query("UPDATE api_keys SET status = 'revoked', revoked_at = now() WHERE id = $1", [id]);
}

export async function touchLastUsed(id: string): Promise<void> {
  await query("UPDATE api_keys SET last_used_at = now() WHERE id = $1", [id]);
}
