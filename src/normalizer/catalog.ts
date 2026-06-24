// Registry deterministico de codigos de erro da WhatsApp Cloud API.
// Caminho primario do normalizador: lookup O(1), sem rede. Popular conforme a
// documentacao oficial da Meta. Sugestoes do fallback LLM (fase 6) entram como
// pendentes de curadoria e, ao serem aprovadas, viram entradas aqui.
import type { Severidade } from "./types.ts";

export interface CatalogEntry {
  motivo: string;
  severidade: Severidade;
  comoCorrigir: string;
  retryable: boolean;
}

export const ERROR_CATALOG: Record<string, CatalogEntry> = {
  "0": {
    motivo: "Nao foi possivel autenticar o usuario do app.",
    severidade: "critico",
    comoCorrigir: "Verifique o token do System User e as permissoes do app.",
    retryable: false,
  },
  "100": {
    motivo: "Parametro invalido na requisicao.",
    severidade: "erro",
    comoCorrigir: "Revise os campos enviados; algum valor ou nome de parametro esta incorreto.",
    retryable: false,
  },
  "190": {
    motivo: "Token de acesso expirado ou invalido.",
    severidade: "critico",
    comoCorrigir: "Gere um novo token de longa duracao do System User e atualize a configuracao.",
    retryable: false,
  },
  "368": {
    motivo: "Conta temporariamente bloqueada por violacao de politicas.",
    severidade: "critico",
    comoCorrigir: "Revise as politicas de mensagens do WhatsApp; aguarde o desbloqueio antes de reenviar.",
    retryable: false,
  },
  "80007": {
    motivo: "Limite de taxa da conta comercial atingido.",
    severidade: "aviso",
    comoCorrigir: "Reduza a cadencia de chamadas e aplique backoff exponencial.",
    retryable: true,
  },
  "130429": {
    motivo: "Throughput de mensagens do Cloud API atingido.",
    severidade: "aviso",
    comoCorrigir: "Enfileire e reenvie com backoff; considere upgrade de throughput do numero.",
    retryable: true,
  },
  "131000": {
    motivo: "Falha generica ao processar a mensagem.",
    severidade: "erro",
    comoCorrigir: "Reenvie; se persistir, verifique o payload e o status do numero.",
    retryable: true,
  },
  "131005": {
    motivo: "Acesso negado ao recurso solicitado.",
    severidade: "erro",
    comoCorrigir: "Confirme as permissoes do app e a posse do ativo (WABA/numero).",
    retryable: false,
  },
  "131008": {
    motivo: "Parametro obrigatorio ausente.",
    severidade: "erro",
    comoCorrigir: "Inclua o campo obrigatorio indicado na mensagem de erro da Meta.",
    retryable: false,
  },
  "131009": {
    motivo: "Valor de parametro invalido.",
    severidade: "erro",
    comoCorrigir: "Corrija o valor do parametro conforme o formato esperado.",
    retryable: false,
  },
  "131016": {
    motivo: "Servico temporariamente indisponivel.",
    severidade: "aviso",
    comoCorrigir: "Reenvie apos um curto intervalo com backoff.",
    retryable: true,
  },
  "131021": {
    motivo: "Destinatario nao pode ser o proprio remetente.",
    severidade: "erro",
    comoCorrigir: "Envie para um numero diferente do numero de origem.",
    retryable: false,
  },
  "131026": {
    motivo: "Mensagem nao entregavel (destinatario nao usa WhatsApp ou nao pode receber).",
    severidade: "erro",
    comoCorrigir: "Confirme se o numero e valido e possui WhatsApp ativo.",
    retryable: false,
  },
  "131031": {
    motivo: "Conta comercial bloqueada.",
    severidade: "critico",
    comoCorrigir: "Verifique o status da conta no WhatsApp Manager; contate o suporte da Meta.",
    retryable: false,
  },
  "131047": {
    motivo: "Janela de 24h encerrada: necessario usar template.",
    severidade: "erro",
    comoCorrigir: "Envie uma mensagem de template aprovado para reabrir a conversa.",
    retryable: false,
  },
  "131051": {
    motivo: "Tipo de mensagem nao suportado.",
    severidade: "erro",
    comoCorrigir: "Use um tipo de mensagem suportado pela Cloud API.",
    retryable: false,
  },
  "131052": {
    motivo: "Falha ao baixar a midia recebida.",
    severidade: "aviso",
    comoCorrigir: "Reenvie a solicitacao de download; verifique o media_id.",
    retryable: true,
  },
  "131053": {
    motivo: "Falha ao subir a midia.",
    severidade: "aviso",
    comoCorrigir: "Verifique formato/tamanho da midia e reenvie o upload.",
    retryable: true,
  },
  "132000": {
    motivo: "Numero de parametros do template nao confere.",
    severidade: "erro",
    comoCorrigir: "Envie exatamente a quantidade de variaveis que o template espera.",
    retryable: false,
  },
  "132001": {
    motivo: "Template inexistente ou nao aprovado neste idioma.",
    severidade: "erro",
    comoCorrigir: "Confirme nome, idioma e status de aprovacao do template.",
    retryable: false,
  },
  "132012": {
    motivo: "Formato de parametro do template invalido.",
    severidade: "erro",
    comoCorrigir: "Ajuste o formato das variaveis ao definido no template.",
    retryable: false,
  },
  "132015": {
    motivo: "Template pausado por baixa qualidade.",
    severidade: "aviso",
    comoCorrigir: "Aguarde a reativacao ou melhore a qualidade; use outro template.",
    retryable: false,
  },
  "132016": {
    motivo: "Template desabilitado.",
    severidade: "erro",
    comoCorrigir: "Use um template ativo; o desabilitado nao pode ser enviado.",
    retryable: false,
  },
  "133010": {
    motivo: "Numero nao registrado na WhatsApp Business Platform.",
    severidade: "critico",
    comoCorrigir: "Registre o numero (endpoint de register) antes de enviar.",
    retryable: false,
  },
};
