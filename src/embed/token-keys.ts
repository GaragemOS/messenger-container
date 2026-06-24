// Carregamento lazy das chaves de assinatura do embed token a partir do
// ambiente (PEM em base64 single-line). Mantido separado de token.ts para que
// a logica de mint/verify continue testavel sem depender de configuracao.
import { importPKCS8, importSPKI, type KeyLike } from "jose";
import { config } from "../config/index.ts";

const ALG = "EdDSA";
const decodePem = (b64: string): string => Buffer.from(b64, "base64").toString("utf8");

let privateKey: Promise<KeyLike> | undefined;
let publicKey: Promise<KeyLike> | undefined;

export function loadPrivateKey(): Promise<KeyLike> {
  if (!config.embed.jwtPrivateKey) throw new Error("EMBED_JWT_PRIVATE_KEY nao configurada");
  return (privateKey ??= importPKCS8(decodePem(config.embed.jwtPrivateKey), ALG));
}

export function loadPublicKey(): Promise<KeyLike> {
  if (!config.embed.jwtPublicKey) throw new Error("EMBED_JWT_PUBLIC_KEY nao configurada");
  return (publicKey ??= importSPKI(decodePem(config.embed.jwtPublicKey), ALG));
}
