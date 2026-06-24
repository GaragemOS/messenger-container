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

test("payload vazio nao quebra", () => {
  assert.deepEqual(extractEvents({}), []);
  assert.deepEqual(extractEvents(null), []);
});
