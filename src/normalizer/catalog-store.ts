// Persistencia de sugestoes do fallback LLM como entradas pendentes de curadoria.
import { query } from "../db/pool.ts";
import type { NormalizedOutcome } from "./types.ts";

export async function saveLlmSuggestion(o: NormalizedOutcome): Promise<void> {
  await query(
    `INSERT INTO error_catalog (code, motivo, severidade, como_corrigir, retryable, origem, approved)
     VALUES ($1, $2, $3, $4, $5, 'llm', false)
     ON CONFLICT (code) DO NOTHING`,
    [o.codigo, o.motivo, o.severidade, o.comoCorrigir, o.retryable],
  );
}
