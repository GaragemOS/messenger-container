// Envio de mensagem: monta o payload canal-agnostico, chama a Graph API e,
// em caso de erro, traduz o codigo da Meta pelo normalizador.
import { buildWhatsAppPayload, type ChannelMessage } from "./payload.ts";
import { graphPost } from "./graph-client.ts";
import { normalize } from "../normalizer/normalize.ts";
import type { NormalizedOutcome } from "../normalizer/types.ts";

export interface SendResult {
  ok: boolean;
  waMessageId?: string;
  outcome?: NormalizedOutcome;
}

export async function sendMessage(phoneNumberId: string, msg: ChannelMessage): Promise<SendResult> {
  const payload = buildWhatsAppPayload(msg);
  const res = await graphPost(`${phoneNumberId}/messages`, payload);
  if (res.ok) {
    const body = res.body as { messages?: Array<{ id?: string }> };
    const id = body.messages?.[0]?.id;
    return id ? { ok: true, waMessageId: id } : { ok: true };
  }
  const body = res.body as { error?: { code?: number | string } };
  const code = body.error?.code ?? res.status;
  return { ok: false, outcome: normalize(code) };
}
