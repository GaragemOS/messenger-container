// Configuracao central da aplicacao.
// Le e normaliza as variaveis de ambiente uma unica vez no boot. Variaveis de
// fases futuras (WhatsApp, LLM, embed) sao opcionais aqui e devem ser validadas
// sob demanda pela feature que as consome, para nao impedir o boot do core.

function req(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === "") {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return v;
}

function opt(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

function bool(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

// Objeto de configuracao imutavel exposto para o resto da aplicacao.
export const config = {
  env: opt("NODE_ENV", "development"),
  port: int("PORT", 3000),
  publicBaseUrl: opt("PUBLIC_BASE_URL", "http://localhost:3000"),
  embedBaseUrl: opt("EMBED_BASE_URL", "http://localhost:3000"),

  db: {
    url: req("DATABASE_URL"),
    ssl: bool("DATABASE_SSL", false),
  },

  auth: {
    // Dominios cujos e-mails podem acessar o console interno.
    allowedDomains: opt("AUTH_ALLOWED_DOMAINS", "garagem.dev.br")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean),
    pepper: opt("SESSION_PEPPER", ""),
  },

  email: {
    resendApiKey: opt("RESEND_API_KEY"),
    from: opt("EMAIL_FROM", "Garagem <no-reply@garagem.dev.br>"),
  },

  embed: {
    jwtPrivateKey: opt("EMBED_JWT_PRIVATE_KEY"),
    jwtPublicKey: opt("EMBED_JWT_PUBLIC_KEY"),
    tokenTtlSeconds: int("EMBED_TOKEN_TTL_SECONDS", 600),
  },

  whatsapp: {
    graphApiVersion: opt("GRAPH_API_VERSION", "v25.0"),
    appSecret: opt("META_APP_SECRET"),
    systemUserToken: opt("META_SYSTEM_USER_TOKEN"),
    webhookVerifyToken: opt("WEBHOOK_VERIFY_TOKEN"),
  },

  llm: {
    fallbackEnabled: bool("LLM_FALLBACK_ENABLED", false),
    anthropicApiKey: opt("ANTHROPIC_API_KEY"),
    model: opt("LLM_FALLBACK_MODEL", "claude-haiku-4-5"),
  },
} as const;

export type Config = typeof config;
