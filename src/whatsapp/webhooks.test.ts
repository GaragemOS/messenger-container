import { test } from "node:test";
import assert from "node:assert/strict";
import { extractEvents } from "./webhooks.ts";

const PAYLOAD = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA_ID",
      changes: [
        {
          value: {
            metadata: { phone_number_id: "PHONE_1" },
            messages: [
              { from: "5511988887777", id: "wamid.IN1", type: "text", timestamp: "1700000000", text: { body: "oi" } },
            ],
            statuses: [
              { id: "wamid.OUT1", status: "delivered", recipient_id: "5511988887777", timestamp: "1700000005" },
              { id: "wamid.OUT2", status: "failed", recipient_id: "5511988887777", timestamp: "1700000010", errors: [{ code: 131026 }] },
            ],
          },
        },
      ],
    },
  ],
};

test("extrai mensagem de entrada", () => {
  const events = extractEvents(PAYLOAD);
  const msg = events.find((e) => e.kind === "message");
  assert.ok(msg);
  assert.equal(msg!.kind === "message" && msg!.text, "oi");
  assert.equal(msg!.phoneNumberId, "PHONE_1");
});

test("extrai status de entrega e falha com codigo de erro", () => {
  const events = extractEvents(PAYLOAD);
  const statuses = events.filter((e) => e.kind === "status");
  assert.equal(statuses.length, 2);
  const failed = statuses.find((s) => s.kind === "status" && s.status === "failed");
  assert.equal(failed!.kind === "status" && failed!.errorCode, "131026");
});

// Payload de referencia: resposta de um Flow finalizado (modo sem endpoint).
const FLOW_REPLY = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA_ID",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "5511999999999", phone_number_id: "PHONE_1" },
            contacts: [{ profile: { name: "Cliente Teste" }, wa_id: "5511988887777" }],
            messages: [
              {
                from: "5511988887777",
                id: "wamid.FLOWREPLY1",
                timestamp: "1700000020",
                type: "interactive",
                interactive: {
                  type: "nfm_reply",
                  nfm_reply: {
                    name: "flow",
                    body: "Sent",
                    response_json: '{"flow_token":"flw_demo_123","nome":"João","email":"joao@exemplo.com","plano":"0"}',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  ],
};

test("extrai resposta de flow (nfm_reply) com flow_token e campos", () => {
  const events = extractEvents(FLOW_REPLY);
  const fr = events.find((e) => e.kind === "flow_response");
  assert.ok(fr);
  assert.equal(fr!.kind === "flow_response" && fr!.flowToken, "flw_demo_123");
  assert.equal(fr!.kind === "flow_response" && fr!.response.nome, "João");
  assert.equal(fr!.kind === "flow_response" && fr!.response.email, "joao@exemplo.com");
  // Nao deve duplicar como mensagem generica.
  assert.equal(events.filter((e) => e.kind === "message").length, 0);
});

test("payload vazio nao quebra", () => {
  assert.deepEqual(extractEvents({}), []);
  assert.deepEqual(extractEvents(null), []);
});
