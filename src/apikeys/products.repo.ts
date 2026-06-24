// Acesso a tabela products (apps da Garagem que consomem a central).
import { query } from "../db/pool.ts";

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  allowed_origins: string[];
}

export async function createProduct(
  name: string,
  slug: string,
  allowedOrigins: string[],
): Promise<ProductRow> {
  const r = await query<ProductRow>(
    `INSERT INTO products (name, slug, allowed_origins) VALUES ($1, $2, $3)
     RETURNING id, name, slug, status, allowed_origins`,
    [name, slug, allowedOrigins],
  );
  return r.rows[0]!;
}

export async function listProducts(): Promise<ProductRow[]> {
  const r = await query<ProductRow>(
    "SELECT id, name, slug, status, allowed_origins FROM products ORDER BY created_at DESC",
  );
  return r.rows;
}

export async function getProduct(id: string): Promise<ProductRow | null> {
  const r = await query<ProductRow>(
    "SELECT id, name, slug, status, allowed_origins FROM products WHERE id = $1",
    [id],
  );
  return r.rows[0] ?? null;
}
