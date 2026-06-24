// Codigos de verificacao de e-mail.
// Gerados com CSPRNG; armazenamos apenas o HMAC do codigo (com pepper do
// servidor), nunca o codigo em claro. Comparacao em tempo constante.
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export function generateCode(digits = 6): string {
  const max = 10 ** digits;
  return String(randomInt(0, max)).padStart(digits, "0");
}

export function hashCode(code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(code).digest("hex");
}

export function verifyCode(code: string, pepper: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashCode(code, pepper), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
