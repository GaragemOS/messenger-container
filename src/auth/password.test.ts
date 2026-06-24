import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, needsRehash } from "./password.ts";

test("hash e verifica senha corretamente", async () => {
  const hash = await hashPassword("senha-super-secreta");
  assert.ok(hash.startsWith("scrypt$"));
  assert.equal(await verifyPassword(hash, "senha-super-secreta"), true);
  assert.equal(await verifyPassword(hash, "senha-errada"), false);
});

test("hashes do mesmo texto sao diferentes (salt aleatorio)", async () => {
  const a = await hashPassword("repetida");
  const b = await hashPassword("repetida");
  assert.notEqual(a, b);
});

test("verifyPassword retorna false para hash invalido sem lancar", async () => {
  assert.equal(await verifyPassword("nao-e-um-hash", "x"), false);
  assert.equal(await verifyPassword("scrypt$abc", "x"), false);
});

test("needsRehash detecta formato invalido", () => {
  assert.equal(needsRehash("bcrypt$x"), true);
});
