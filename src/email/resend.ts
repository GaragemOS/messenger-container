// Cliente minimo do Resend via fetch (sem SDK). Usado para enviar o codigo
// de verificacao do console.
import { config } from "../config/index.ts";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  if (!config.email.resendApiKey) {
    throw new Error("RESEND_API_KEY nao configurada");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.email.resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from: config.email.from, to, subject, html, ...(text ? { text } : {}) }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Falha no envio (Resend ${res.status}): ${body.slice(0, 300)}`);
  }
}

// Conteudo do e-mail de codigo de acesso.
export function verificationEmail(code: string): { subject: string; html: string; text: string } {
  return {
    subject: "Seu codigo de acesso - Garagem",
    text: `Seu codigo de acesso e ${code}. Ele expira em 10 minutos.`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="margin:0 0 8px">Codigo de acesso</h2>
      <p style="color:#444">Use o codigo abaixo para acessar o console da Garagem. Ele expira em 10 minutos.</p>
      <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:16px 0">${code}</p>
      <p style="color:#888;font-size:13px">Se voce nao solicitou este acesso, ignore este e-mail.</p>
    </div>`,
  };
}
