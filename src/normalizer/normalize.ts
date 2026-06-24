// Normalizador deterministico: traduz um codigo de erro/estado da Cloud API
// para o contrato { motivo, severidade, comoCorrigir, retryable }. Lookup O(1).
// O fallback via LLM (fase 6, atras de flag) so e considerado quando o codigo
// nao esta no registry; o caminho feliz nunca depende de rede.
import { ERROR_CATALOG } from "./catalog.ts";
import type { NormalizedOutcome } from "./types.ts";

export function normalize(code: string | number): NormalizedOutcome {
  const codigo = String(code);
  const entry = ERROR_CATALOG[codigo];
  if (entry) {
    return {
      codigo,
      motivo: entry.motivo,
      severidade: entry.severidade,
      comoCorrigir: entry.comoCorrigir,
      retryable: entry.retryable,
      origem: "registry",
    };
  }
  return {
    codigo,
    motivo: "Erro nao catalogado.",
    severidade: "erro",
    comoCorrigir: `Consulte o codigo ${codigo} na documentacao de erros da WhatsApp Cloud API.`,
    retryable: false,
    origem: "desconhecido",
  };
}
