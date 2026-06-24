// Geracao, parsing e verificacao de API keys por produto.
// Formato: mc_<env>_<keyId>.<secret>. Guardamos apenas sha256(secret) no banco;
// o secret e mostrado uma unica vez na criacao.
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

export interface GeneratedKey {
  keyId: string;
  secret: string;
  full: string;
  lastFour: string;
  secretHash: string;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateApiKey(environment: "live" | "test" = "live"): GeneratedKey {
  const keyId = randomBytes(12).toString("base64url");
  const secret = randomBytes(24).toString("base64url");
  const full = `mc_${environment}_${keyId}.${secret}`;
  return { keyId, secret, full, lastFour: secret.slice(-4), secretHash: sha256(secret) };
}

export interface ParsedKey {
  environment: string;
  keyId: string;
  secret: string;
}

export function parseApiKey(full: string): ParsedKey | null {
  const m = /^mc_(live|test)_([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(full.trim());
  if (!m) return null;
  return { environment: m[1]!, keyId: m[2]!, secret: m[3]! };
}

// Comparacao em tempo constante do secret contra o hash armazenado.
export function verifySecret(secret: string, expectedHash: string): boolean {
  const a = Buffer.from(sha256(secret), "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
