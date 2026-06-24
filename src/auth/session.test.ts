import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSessionToken, hashSessionToken } from "./session.ts";

test("gera tokens unicos", () => {
  assert.notEqual(generateSessionToken(), generateSessionToken());
});

test("hash e estavel para o mesmo token e diferente entre tokens", () => {
  const a = generateSessionToken();
  const b = generateSessionToken();
  assert.equal(hashSessionToken(a), hashSessionToken(a));
  assert.notEqual(hashSessionToken(a), hashSessionToken(b));
});
