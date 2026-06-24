import { test } from "node:test";
import assert from "node:assert/strict";
import { generateCode, hashCode, verifyCode } from "./codes.ts";

test("gera codigo de 6 digitos numericos", () => {
  for (let i = 0; i < 200; i++) {
    assert.match(generateCode(6), /^\d{6}$/);
  }
});

test("verifyCode aceita o correto e rejeita o errado", () => {
  const pepper = "test-pepper";
  const hash = hashCode("123456", pepper);
  assert.equal(verifyCode("123456", pepper, hash), true);
  assert.equal(verifyCode("654321", pepper, hash), false);
});

test("hash muda com pepper diferente", () => {
  assert.notEqual(hashCode("123456", "p1"), hashCode("123456", "p2"));
});

test("verifyCode lida com hash de tamanho invalido sem lancar", () => {
  assert.equal(verifyCode("123456", "p", "abc"), false);
});
