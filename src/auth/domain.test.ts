import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedDomain, normalizeEmail, emailDomain, isValidEmail } from "./domain.ts";

test("aceita e-mail do dominio permitido (case-insensitive)", () => {
  assert.equal(isAllowedDomain("Joao@Garagem.dev.br", ["garagem.dev.br"]), true);
});

test("rejeita dominio diferente", () => {
  assert.equal(isAllowedDomain("joao@gmail.com", ["garagem.dev.br"]), false);
});

test("rejeita subdominio nao listado", () => {
  assert.equal(isAllowedDomain("joao@mail.garagem.dev.br", ["garagem.dev.br"]), false);
});

test("rejeita bypass com multiplos @", () => {
  assert.equal(isAllowedDomain("joao@garagem.dev.br@gmail.com", ["garagem.dev.br"]), false);
  assert.equal(isValidEmail("a@b@garagem.dev.br"), false);
});

test("normaliza espaco e caixa", () => {
  assert.equal(normalizeEmail("  Joao@Garagem.DEV.br "), "joao@garagem.dev.br");
});

test("extrai dominio apos o ultimo @", () => {
  assert.equal(emailDomain("joao@garagem.dev.br"), "garagem.dev.br");
  assert.equal(emailDomain("sem-arroba"), null);
});
