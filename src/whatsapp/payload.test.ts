import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppPayload } from "./payload.ts";

test("monta payload de texto", () => {
  const p = buildWhatsAppPayload({ to: "5511999", type: "text", text: "ola" }) as any;
  assert.equal(p.messaging_product, "whatsapp");
  assert.equal(p.to, "5511999");
  assert.equal(p.type, "text");
  assert.deepEqual(p.text, { body: "ola" });
});

test("monta payload de template com idioma e componentes", () => {
  const p = buildWhatsAppPayload({
    to: "5511999",
    type: "template",
    template: { name: "boas_vindas", language: "pt_BR", components: [{ type: "body" }] },
  }) as any;
  assert.equal(p.type, "template");
  assert.equal(p.template.name, "boas_vindas");
  assert.deepEqual(p.template.language, { code: "pt_BR" });
  assert.equal(p.template.components.length, 1);
});

test("erros para conteudo ausente", () => {
  assert.throws(() => buildWhatsAppPayload({ to: "x", type: "text" }));
  assert.throws(() => buildWhatsAppPayload({ to: "x", type: "template" }));
});
