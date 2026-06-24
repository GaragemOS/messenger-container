// Modelo de escopo do embed e verificacao de contencao.
// Eixos: telas (class), empresas clientes e numeros. "*" significa "todos".

export interface EmbedScope {
  classes: string[];
  client_companies: string[];
  phone_numbers: string[];
}

const ALL = "*";

function within(allowed: string[], requested: string[]): boolean {
  if (allowed.includes(ALL)) return true;
  return requested.every((r) => allowed.includes(r));
}

// O escopo solicitado deve estar inteiramente contido no escopo permitido.
export function scopeContains(allowed: EmbedScope, requested: EmbedScope): boolean {
  return (
    within(allowed.classes, requested.classes) &&
    within(allowed.client_companies, requested.client_companies) &&
    within(allowed.phone_numbers, requested.phone_numbers)
  );
}

// Escopo "tudo permitido" — default de uma chave nova ate haver restricoes.
export function fullScope(): EmbedScope {
  return { classes: [ALL], client_companies: [ALL], phone_numbers: [ALL] };
}
