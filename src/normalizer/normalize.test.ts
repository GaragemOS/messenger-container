import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize } from "./normalize.ts";
import { validateCatalog } from "./catalog.schema.ts";

test("codigo conhecido vem do registry com todos os campos", () => {
  const r = normalize(131047);
  assert.equal(r.codigo, "131047");
  assert.equal(r.origem, "registry");
  assert.equal(r.severidade, "erro");
  assert.match(r.comoCorrigir, /template/i);
  assert.equal(typeof r.retryable, "boolean");
});

test("codigo de rate limit e retryable", () => {
  assert.equal(normalize(130429).retryable, true);
});

test("codigo desconhecido cai em 'desconhecido' sem quebrar", () => {
  const r = normalize("999999");
  assert.equal(r.origem, "desconhecido");
  assert.equal(r.severidade, "erro");
  assert.match(r.comoCorrigir, /999999/);
});

test("catalogo passa na validacao de schema", () => {
  assert.doesNotThrow(() => validateCatalog());
});
