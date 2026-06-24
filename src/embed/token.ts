// Embed token efemero (JWT EdDSA). E a unica credencial que chega ao browser:
// curta duracao, escopada, e validada server-side. A API key secreta o cunha.
import { SignJWT, jwtVerify, type JWTPayload, type KeyLike } from "jose";
import { randomUUID } from "node:crypto";
import type { EmbedScope } from "./scope.ts";

const ALG = "EdDSA";

export interface MintParams {
  productId: string;
  cls: string;
  scope: EmbedScope;
  audience: string[];
  ttlSeconds: number;
  session?: string;
}

export interface EmbedClaims extends JWTPayload {
  prd: string;
  cls: string;
  scp: EmbedScope;
  sess?: string;
}

export async function mintEmbedToken(privateKey: KeyLike, params: MintParams): Promise<string> {
  const payload: JWTPayload = { prd: params.productId, cls: params.cls, scp: params.scope };
  if (params.session) payload.sess = params.session;
  let jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${params.ttlSeconds}s`)
    .setJti(randomUUID());
  if (params.audience.length) jwt = jwt.setAudience(params.audience);
  return jwt.sign(privateKey);
}

export async function verifyEmbedToken(publicKey: KeyLike, token: string): Promise<EmbedClaims> {
  const { payload } = await jwtVerify(token, publicKey);
  return payload as EmbedClaims;
}
