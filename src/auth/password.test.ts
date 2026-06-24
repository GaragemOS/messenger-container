import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./password.ts";

test("hash e verifica senha corretamente", async () => {
  const hash = await hashPassword("senha-super-secreta");
  assert.ok(hash.startsWith("$argon2id$"));
  assert.equal(await verifyPassword(hash, "senha-super-secreta"), true);
  assert.equal(await verifyPassword(hash, "senha-errada"), false);
});

test("verifyPassword retorna false para hash invalido sem lancar", async () => {
  assert.equal(await verifyPassword("nao-e-um-hash", "x"), false);
});
