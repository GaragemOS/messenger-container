// Hash de senha com scrypt (KDF embutido no Node, sem dependencia nativa externa).
// Formato armazenado: scrypt$N$r$p$salt_b64$hash_b64. Parametros de custo
// alinhados a recomendacao da OWASP para uso interno com rate-limit.
import { scrypt as scryptCb, randomBytes, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Wrapper async tipado sobre scrypt (a versao promisify nao cobre a sobrecarga
// com options).
function scrypt(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

const N = 32768; // custo de CPU/memoria (2^15)
const R = 8; // tamanho de bloco
const P = 1; // paralelismo
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024; // acima do default de 32 MiB para suportar N=2^15

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM })) as Buffer;
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4]!, "base64");
    const expected = Buffer.from(parts[5]!, "base64");
    const derived = (await scrypt(password, salt, expected.length, { N: n, r, p, maxmem: MAXMEM })) as Buffer;
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// Indica se o hash usa parametros antigos e deve ser recalculado no proximo login.
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return true;
  return Number(parts[1]) !== N || Number(parts[2]) !== R || Number(parts[3]) !== P;
}
