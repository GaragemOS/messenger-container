import { test } from "node:test";
import assert from "node:assert/strict";
import { generateApiKey, parseApiKey, verifySecret, sha256 } from "./keys.ts";

test("gera chave no formato mc_<env>_<keyId>.<secret>", () => {
  const k = generateApiKey("live");
  assert.match(k.full, /^mc_live_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.equal(k.lastFour, k.secret.slice(-4));
  assert.equal(k.secretHash, sha256(k.secret));
});

test("parse extrai env, keyId e secret", () => {
  const k = generateApiKey("test");
  const p = parseApiKey(k.full);
  assert.ok(p);
  assert.equal(p!.environment, "test");
  assert.equal(p!.keyId, k.keyId);
  assert.equal(p!.secret, k.secret);
});

test("parse rejeita formatos invalidos", () => {
  assert.equal(parseApiKey("sk_live_abc.def"), null);
  assert.equal(parseApiKey("mc_prod_abc.def"), null);
  assert.equal(parseApiKey("lixo"), null);
});

test("verifySecret aceita o correto e rejeita o errado", () => {
  const k = generateApiKey();
  assert.equal(verifySecret(k.secret, k.secretHash), true);
  assert.equal(verifySecret("errado", k.secretHash), false);
});
