// Fallback opcional do normalizador via Claude Messages API (fetch direto, sem SDK).
// Usado apenas para codigos desconhecidos quando a flag esta ligada. Modelo
// barato (claude-haiku-4-5) com structured outputs (output_config.format) para
// garantir o JSON. Qualquer falha retorna null (degradacao graciosa).
import { config } from "../config/index.ts";
import type { NormalizedOutcome, Severidade } from "./types.ts";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    motivo: { type: "string" },
    severidade: { type: "string", enum: ["info", "aviso", "erro", "critico"] },
    comoCorrigir: { type: "string" },
    retryable: { type: "boolean" },
  },
  required: ["motivo", "severidade", "comoCorrigir", "retryable"],
};

type LlmFields = Pick<NormalizedOutcome, "motivo" | "severidade" | "comoCorrigir" | "retryable">;

export async function classifyErrorWithLlm(code: string): Promise<LlmFields | null> {
  if (!config.llm.anthropicApiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": config.llm.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.llm.model,
        max_tokens: 512,
        system:
          "Voce e especialista na WhatsApp Cloud API da Meta. Dado um codigo de erro, explique em portugues do Brasil o motivo, a severidade (info/aviso/erro/critico), como corrigir e se e retryable. Responda apenas no formato JSON solicitado.",
        messages: [
          { role: "user", content: `Codigo de erro da WhatsApp Cloud API: ${code}. Classifique-o.` },
        ],
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      stop_reason?: string;
      content?: Array<{ type: string; text?: string }>;
    };
    if (data.stop_reason === "refusal") return null;
    const text = data.content?.find((b) => b.type === "text")?.text;
    if (!text) return null;
    const parsed = JSON.parse(text) as {
      motivo: string;
      severidade: Severidade;
      comoCorrigir: string;
      retryable: boolean;
    };
    return {
      motivo: parsed.motivo,
      severidade: parsed.severidade,
      comoCorrigir: parsed.comoCorrigir,
      retryable: parsed.retryable,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
