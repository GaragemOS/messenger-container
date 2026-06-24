import { test } from "node:test";
import assert from "node:assert/strict";
import { scopeContains, fullScope, type EmbedScope } from "./scope.ts";

test("escopo total contem qualquer pedido", () => {
  const req: EmbedScope = { classes: ["flows"], client_companies: ["c1"], phone_numbers: ["p1"] };
  assert.equal(scopeContains(fullScope(), req), true);
});

test("escopo restrito permite apenas o que lista", () => {
  const allowed: EmbedScope = { classes: ["templates"], client_companies: ["c1"], phone_numbers: ["*"] };
  assert.equal(scopeContains(allowed, { classes: ["templates"], client_companies: ["c1"], phone_numbers: ["p9"] }), true);
  assert.equal(scopeContains(allowed, { classes: ["flows"], client_companies: ["c1"], phone_numbers: ["p9"] }), false);
  assert.equal(scopeContains(allowed, { classes: ["templates"], client_companies: ["c2"], phone_numbers: ["p9"] }), false);
});
