// Construcao do payload da Cloud API a partir de uma mensagem canal-agnostica.
// Mantem a interface interna estavel para futuros canais (SMS/email/Telegram).

export interface ChannelMessage {
  to: string;
  type: "text" | "template";
  text?: string;
  template?: {
    name: string;
    language: string;
    components?: unknown[];
  };
}

export function buildWhatsAppPayload(msg: ChannelMessage): Record<string, unknown> {
  const base = { messaging_product: "whatsapp", recipient_type: "individual", to: msg.to };

  if (msg.type === "text") {
    if (!msg.text) throw new Error("mensagem de texto sem conteudo");
    return { ...base, type: "text", text: { body: msg.text } };
  }

  if (msg.type === "template") {
    if (!msg.template) throw new Error("mensagem de template sem definicao");
    return {
      ...base,
      type: "template",
      template: {
        name: msg.template.name,
        language: { code: msg.template.language },
        ...(msg.template.components ? { components: msg.template.components } : {}),
      },
    };
  }

  throw new Error(`tipo de mensagem nao suportado: ${String(msg.type)}`);
}
