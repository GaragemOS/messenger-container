import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSignature, verifySignature } from "./signature.ts";

const SECRET = "app-secret-de-teste";
const BODY = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

test("assinatura correta e aceita", () => {
  const sig = computeSignature(BODY, SECRET);
  assert.equal(verifySignature(BODY, sig, SECRET), true);
});

test("corpo adulterado e rejeitado", () => {
  const sig = computeSignature(BODY, SECRET);
  assert.equal(verifySignature(BODY + " ", sig, SECRET), false);
});

test("secret errado e rejeitado", () => {
  const sig = computeSignature(BODY, "outro-secret");
  assert.equal(verifySignature(BODY, sig, SECRET), false);
});

test("header ausente ou secret vazio sao rejeitados", () => {
  assert.equal(verifySignature(BODY, undefined, SECRET), false);
  assert.equal(verifySignature(BODY, computeSignature(BODY, SECRET), ""), false);
});
