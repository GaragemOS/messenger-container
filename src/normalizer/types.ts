// Contrato de saida do normalizador de mensagens.
export type Severidade = "info" | "aviso" | "erro" | "critico";

export interface NormalizedOutcome {
  codigo: string;
  motivo: string;
  severidade: Severidade;
  comoCorrigir: string;
  retryable: boolean;
  origem: "registry" | "llm" | "desconhecido";
}
