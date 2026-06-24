import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair } from "jose";
import { mintEmbedToken, verifyEmbedToken } from "./token.ts";
import { fullScope } from "./scope.ts";

test("mint e verify fazem roundtrip com as claims corretas", async () => {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA");
  const token = await mintEmbedToken(privateKey, {
    productId: "prod_1",
    cls: "flows",
    scope: fullScope(),
    audience: ["https://app.garagem.dev"],
    ttlSeconds: 600,
    session: "sess_abc",
  });
  const claims = await verifyEmbedToken(publicKey, token);
  assert.equal(claims.prd, "prod_1");
  assert.equal(claims.cls, "flows");
  assert.equal(claims.sess, "sess_abc");
  assert.deepEqual(claims.scp, fullScope());
  assert.ok(claims.exp && claims.iat && claims.exp > claims.iat);
});

test("verify rejeita token assinado por outra chave", async () => {
  const a = await generateKeyPair("EdDSA");
  const b = await generateKeyPair("EdDSA");
  const token = await mintEmbedToken(a.privateKey, {
    productId: "p", cls: "metrics", scope: fullScope(), audience: [], ttlSeconds: 600,
  });
  await assert.rejects(() => verifyEmbedToken(b.publicKey, token));
});
