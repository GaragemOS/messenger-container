// Acesso a tabela templates, escopado ao produto.
import { query } from "../db/pool.ts";

export interface TemplateRow {
  id: string;
  waba_id: string;
  name: string;
  language: string;
  category: string;
  status: string;
}

export async function createTemplate(input: {
  wabaId: string;
  productId: string;
  name: string;
  language: string;
  category: string;
  components: unknown;
  variables: unknown;
}): Promise<TemplateRow> {
  const r = await query<TemplateRow>(
    `INSERT INTO templates (waba_id, product_id, name, language, category, components, variables)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, waba_id, name, language, category, status`,
    [
      input.wabaId,
      input.productId,
      input.name,
      input.language,
      input.category,
      JSON.stringify(input.components ?? {}),
      JSON.stringify(input.variables ?? []),
    ],
  );
  return r.rows[0]!;
}

export async function listTemplates(productId: string): Promise<TemplateRow[]> {
  const r = await query<TemplateRow>(
    `SELECT id, waba_id, name, language, category, status FROM templates
     WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId],
  );
  return r.rows;
}

export async function getTemplate(productId: string, id: string): Promise<TemplateRow | null> {
  const r = await query<TemplateRow>(
    `SELECT id, waba_id, name, language, category, status FROM templates
     WHERE id = $1 AND product_id = $2`,
    [id, productId],
  );
  return r.rows[0] ?? null;
}

export async function updateTemplateStatus(
  productId: string,
  id: string,
  status: string,
): Promise<void> {
  await query("UPDATE templates SET status = $3 WHERE id = $1 AND product_id = $2", [id, productId, status]);
}
