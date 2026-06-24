// Tokens de sessao opacos (256 bits). Guardamos apenas o sha256 no banco,
// permitindo revogacao imediata e sem expor o token original em caso de dump.
import { randomBytes, createHash } from "node:crypto";

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
