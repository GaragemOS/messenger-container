// Normalizacao com fallback opcional. Caminho primario deterministico; so chama
// o LLM para codigos desconhecidos quando a flag esta ligada. Mantido separado
// de normalize.ts para que o caminho deterministico continue puro/testavel.
import { config } from "../config/index.ts";
import { normalize } from "./normalize.ts";
import { classifyErrorWithLlm } from "./llm.ts";
import { saveLlmSuggestion } from "./catalog-store.ts";
import type { NormalizedOutcome } from "./types.ts";

export async function normalizeWithFallback(code: string | number): Promise<NormalizedOutcome> {
  const base = normalize(code);
  if (base.origem !== "desconhecido" || !config.llm.fallbackEnabled) {
    return base;
  }
  const llm = await classifyErrorWithLlm(String(code));
  if (!llm) return base;
  const outcome: NormalizedOutcome = { codigo: String(code), ...llm, origem: "llm" };
  await saveLlmSuggestion(outcome).catch(() => {});
  return outcome;
}
