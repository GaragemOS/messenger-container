// Cliente fino da Graph API (Cloud API). Versao fixada via env (v25.0).
// Backoff exponencial em 429/5xx; demais respostas retornam direto.
import { config } from "../config/index.ts";

export interface GraphResult {
  ok: boolean;
  status: number;
  body: unknown;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function graphPost(path: string, body: unknown): Promise<GraphResult> {
  const url = `https://graph.facebook.com/${config.whatsapp.graphApiVersion}/${path}`;
  let last: GraphResult = { ok: false, status: 0, body: null };
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.whatsapp.systemUserToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    last = { ok: res.ok, status: res.status, body: json };
    if (res.ok || (res.status !== 429 && res.status < 500)) return last;
    await delay(250 * 2 ** attempt);
  }
  return last;
}
