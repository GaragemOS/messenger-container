// Validacao do catalogo de erros no boot (fail-fast).
import { ERROR_CATALOG } from "./catalog.ts";

const SEVERIDADES = ["info", "aviso", "erro", "critico"];

export function validateCatalog(): void {
  for (const [code, e] of Object.entries(ERROR_CATALOG)) {
    if (!e.motivo || !e.comoCorrigir) {
      throw new Error(`Catalogo invalido (${code}): motivo/comoCorrigir ausente`);
    }
    if (!SEVERIDADES.includes(e.severidade)) {
      throw new Error(`Catalogo invalido (${code}): severidade '${e.severidade}'`);
    }
    if (typeof e.retryable !== "boolean") {
      throw new Error(`Catalogo invalido (${code}): retryable nao booleano`);
    }
  }
}
