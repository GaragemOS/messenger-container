// Extracao de eventos de um payload de webhook da WhatsApp Cloud API.
// Funcao pura: nao toca banco nem rede; apenas normaliza a estrutura aninhada
// em uma lista plana de eventos para processamento posterior.

export interface InboundMessageEvent {
  kind: "message";
  from: string;
  phoneNumberId: string;
  waMessageId: string;
  type: string;
  timestamp: string;
  text?: string;
}

export interface StatusEvent {
  kind: "status";
  waMessageId: string;
  status: string;
  recipient: string;
  phoneNumberId: string;
  timestamp: string;
  errorCode?: string;
}

// Resposta de um Flow finalizado (modo sem endpoint): chega como mensagem
// interactive do tipo nfm_reply, cujo response_json (string) traz os campos
// preenchidos e o flow_token usado para correlacionar a sessao de origem.
export interface FlowResponseEvent {
  kind: "flow_response";
  from: string;
  phoneNumberId: string;
  waMessageId: string;
  timestamp: string;
  flowToken: string | null;
  response: Record<string, unknown>;
}

export type WebhookEvent = InboundMessageEvent | StatusEvent | FlowResponseEvent;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function extractEvents(payload: any): WebhookEvent[] {
  const events: WebhookEvent[] = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value ?? {};
      const phoneNumberId: string = value?.metadata?.phone_number_id ?? "";

      for (const m of value?.messages ?? []) {
        // Resposta de Flow (nfm_reply): desempacota o response_json e o flow_token.
        if (m.type === "interactive" && m.interactive?.type === "nfm_reply") {
          const rawJson = m.interactive?.nfm_reply?.response_json;
          let parsed: Record<string, unknown> = {};
          try {
            parsed = typeof rawJson === "string" && rawJson ? JSON.parse(rawJson) : {};
          } catch {
            parsed = {};
          }
          const ft = parsed["flow_token"];
          events.push({
            kind: "flow_response",
            from: m.from,
            phoneNumberId,
            waMessageId: m.id,
            timestamp: m.timestamp,
            flowToken: typeof ft === "string" ? ft : null,
            response: parsed,
          });
          continue;
        }
        events.push({
          kind: "message",
          from: m.from,
          phoneNumberId,
          waMessageId: m.id,
          type: m.type,
          timestamp: m.timestamp,
          ...(m.text?.body ? { text: m.text.body } : {}),
        });
      }

      for (const s of value?.statuses ?? []) {
        const code = s.errors?.[0]?.code;
        events.push({
          kind: "status",
          waMessageId: s.id,
          status: s.status,
          recipient: s.recipient_id,
          phoneNumberId,
          timestamp: s.timestamp,
          ...(code != null ? { errorCode: String(code) } : {}),
        });
      }
    }
  }
  return events;
}
