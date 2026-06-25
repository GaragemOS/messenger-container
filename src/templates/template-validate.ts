// Validacao de campos de template antes de persistir (e, futuramente, antes de
// submeter a Meta). Falha local barata, sem gastar quota da API.

export interface TemplateInput {
  name: string;
  language?: string;
  category: string;
  components?: unknown;
  variables?: Array<{ index: number; example?: string }>;
}

const NAME_RE = /^[a-z0-9_]{1,512}$/;
const CATEGORIES = ["marketing", "utility", "authentication"];

export function validateTemplateInput(input: TemplateInput): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.name || !NAME_RE.test(input.name)) {
    errors.push("name deve conter apenas letras minusculas, numeros e underscore");
  }
  if (!CATEGORIES.includes(input.category)) {
    errors.push("category invalida (use marketing, utility ou authentication)");
  }
  if (input.components == null || typeof input.components !== "object") {
    errors.push("components obrigatorio (objeto com header/body/footer/buttons)");
  }
  if (input.variables) {
    const indices = input.variables.map((v) => v.index);
    if (new Set(indices).size !== indices.length) {
      errors.push("variables com indices duplicados");
    }
  }
  return { ok: errors.length === 0, errors };
}
