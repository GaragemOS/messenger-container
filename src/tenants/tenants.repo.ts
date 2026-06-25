// Acesso multitenant: empresas clientes, WABAs e numeros, sempre escopados ao
// produto. As listagens aceitam um escopo de empresas ("*" = todas).
import { query } from "../db/pool.ts";

export interface CompanyRow {
  id: string;
  external_ref: string | null;
  name: string;
  status: string;
}

export async function createCompany(
  productId: string,
  name: string,
  externalRef: string | null,
): Promise<CompanyRow> {
  const r = await query<CompanyRow>(
    `INSERT INTO client_companies (product_id, name, external_ref) VALUES ($1, $2, $3)
     RETURNING id, external_ref, name, status`,
    [productId, name, externalRef],
  );
  return r.rows[0]!;
}

export async function listCompanies(productId: string, scope: string[]): Promise<CompanyRow[]> {
  const all = scope.includes("*");
  const r = await query<CompanyRow>(
    `SELECT id, external_ref, name, status FROM client_companies
     WHERE product_id = $1 ${all ? "" : "AND id = ANY($2::uuid[])"}
     ORDER BY created_at DESC`,
    all ? [productId] : [productId, scope],
  );
  return r.rows;
}

export async function getCompany(productId: string, id: string): Promise<{ id: string } | null> {
  const r = await query<{ id: string }>(
    "SELECT id FROM client_companies WHERE id = $1 AND product_id = $2",
    [id, productId],
  );
  return r.rows[0] ?? null;
}

export async function createWaba(
  companyId: string,
  wabaIdMeta: string,
  name: string | null,
): Promise<{ id: string }> {
  const r = await query<{ id: string }>(
    "INSERT INTO wabas (client_company_id, waba_id_meta, name) VALUES ($1, $2, $3) RETURNING id",
    [companyId, wabaIdMeta, name],
  );
  return r.rows[0]!;
}

export interface WabaRow {
  id: string;
  waba_id_meta: string;
  name: string | null;
  company_id: string;
  company_name: string;
}

export async function listWabas(productId: string): Promise<WabaRow[]> {
  const r = await query<WabaRow>(
    `SELECT w.id, w.waba_id_meta, w.name, cc.id AS company_id, cc.name AS company_name
     FROM wabas w JOIN client_companies cc ON cc.id = w.client_company_id
     WHERE cc.product_id = $1 ORDER BY cc.name, w.created_at`,
    [productId],
  );
  return r.rows;
}

export async function getWabaCompany(productId: string, wabaId: string): Promise<{ company_id: string } | null> {
  const r = await query<{ company_id: string }>(
    `SELECT w.client_company_id AS company_id FROM wabas w
       JOIN client_companies cc ON cc.id = w.client_company_id
     WHERE w.id = $1 AND cc.product_id = $2`,
    [wabaId, productId],
  );
  return r.rows[0] ?? null;
}

export async function createNumber(input: {
  wabaId: string;
  companyId: string;
  phoneNumberIdMeta: string;
  displayPhone: string | null;
  displayName: string | null;
}): Promise<{ id: string }> {
  const r = await query<{ id: string }>(
    `INSERT INTO phone_numbers (waba_id, client_company_id, phone_number_id_meta, display_phone, display_name)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [input.wabaId, input.companyId, input.phoneNumberIdMeta, input.displayPhone, input.displayName],
  );
  return r.rows[0]!;
}

export interface NumberRow {
  id: string;
  phone_number_id_meta: string;
  display_phone: string | null;
  display_name: string | null;
  quality_rating: string;
  status: string;
  company_id: string;
  company_name: string;
}

export async function listNumbers(productId: string, scope: string[]): Promise<NumberRow[]> {
  const all = scope.includes("*");
  const r = await query<NumberRow>(
    `SELECT pn.id, pn.phone_number_id_meta, pn.display_phone, pn.display_name, pn.quality_rating, pn.status,
            cc.id AS company_id, cc.name AS company_name
     FROM phone_numbers pn JOIN client_companies cc ON cc.id = pn.client_company_id
     WHERE cc.product_id = $1 ${all ? "" : "AND cc.id = ANY($2::uuid[])"}
     ORDER BY cc.name`,
    all ? [productId] : [productId, scope],
  );
  return r.rows;
}
