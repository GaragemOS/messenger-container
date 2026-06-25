import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTemplateInput } from "./template-validate.ts";

test("aceita template valido", () => {
  const r = validateTemplateInput({ name: "boas_vindas", category: "utility", components: { body: { text: "ola" } } });
  assert.equal(r.ok, true);
  assert.equal(r.errors.length, 0);
});

test("rejeita name invalido e category invalida", () => {
  const r = validateTemplateInput({ name: "Boas Vindas!", category: "promo", components: {} });
  assert.equal(r.ok, false);
  assert.ok(r.errors.length >= 2);
});

test("rejeita components ausente", () => {
  const r = validateTemplateInput({ name: "x", category: "marketing" });
  assert.ok(r.errors.some((e) => e.includes("components")));
});

test("rejeita indices de variaveis duplicados", () => {
  const r = validateTemplateInput({
    name: "x", category: "utility", components: {},
    variables: [{ index: 1 }, { index: 1 }],
  });
  assert.ok(r.errors.some((e) => e.includes("indices")));
});
