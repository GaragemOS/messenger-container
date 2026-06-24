// Validacao da assinatura dos webhooks da Meta (X-Hub-Signature-256).
// Deve operar sobre o CORPO BRUTO da requisicao (antes do parse JSON).
import { createHmac, timingSafeEqual } from "node:crypto";

export function computeSignature(rawBody: Buffer | string, appSecret: string): string {
  return "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
}

export function verifySignature(
  rawBody: Buffer | string,
  header: string | undefined,
  appSecret: string,
): boolean {
  if (!header || !appSecret) return false;
  const expected = computeSignature(rawBody, appSecret);
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
