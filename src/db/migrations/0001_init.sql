-- ==========================================================================
-- 0001_init.sql — schema inicial do messenger-container.
-- Eixos de isolamento multitenant: client_company_id + phone_number_id em toda
-- tabela "quente". gen_random_uuid() exige Postgres 13+ (core) / pgcrypto.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Funcao generica para manter updated_at em sincronia em UPDATEs.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- AUTH DO CONSOLE (uso interno Garagem)
-- --------------------------------------------------------------------------

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,                 -- sempre lowercase
  password_hash text,                                 -- null ate definir senha
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'disabled')),
  failed_logins int  NOT NULL DEFAULT 0,
  locked_until  timestamptz,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Codigos de verificacao de e-mail (signup/reset). Guardamos o HMAC, nao o codigo.
CREATE TABLE email_verification_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  code_hash   text NOT NULL,
  purpose     text NOT NULL CHECK (purpose IN ('signup', 'reset')),
  attempts    int  NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_evc_email_active ON email_verification_codes (email)
  WHERE consumed_at IS NULL;

-- Sessoes opacas (token aleatorio; guardamos sha256). Revogacao imediata.
CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  ip           text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz
);
CREATE INDEX idx_sessions_user ON sessions (user_id);

-- Contadores de rate-limit em janela fixa (sem Redis no v1).
CREATE TABLE auth_rate_limits (
  bucket_key   text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count        int NOT NULL DEFAULT 0
);

-- --------------------------------------------------------------------------
-- PRODUTOS DA GARAGEM (consumidores da central) E API KEYS
-- --------------------------------------------------------------------------

CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'disabled')),
  allowed_origins text[] NOT NULL DEFAULT '{}',       -- allowlist do embed
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- API key por produto: key_id publico (lookup O(1)) + sha256(secret).
CREATE TABLE api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key_id      text NOT NULL UNIQUE,
  secret_hash text NOT NULL,
  last_four   text NOT NULL,
  environment text NOT NULL DEFAULT 'live'
                CHECK (environment IN ('live', 'test')),
  scopes      jsonb NOT NULL DEFAULT '{}',
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'revoked')),
  created_by  uuid REFERENCES users(id),
  last_used_at timestamptz,
  expires_at  timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_keys_product ON api_keys (product_id);

-- --------------------------------------------------------------------------
-- MULTITENANT: empresas clientes -> WABAs -> numeros
-- --------------------------------------------------------------------------

CREATE TABLE client_companies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  external_ref text,                                   -- id no sistema do produto
  name         text NOT NULL,
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'suspended', 'disabled')),
  opt_in_policy jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, external_ref)
);
CREATE INDEX idx_client_companies_product ON client_companies (product_id);
CREATE TRIGGER trg_client_companies_updated BEFORE UPDATE ON client_companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE wabas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_company_id uuid NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  waba_id_meta      text NOT NULL UNIQUE,
  name              text,
  status            text NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wabas_company ON wabas (client_company_id);

CREATE TABLE phone_numbers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waba_id              uuid NOT NULL REFERENCES wabas(id) ON DELETE CASCADE,
  client_company_id    uuid NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  phone_number_id_meta text NOT NULL UNIQUE,
  display_phone        text,
  display_name         text,
  quality_rating       text NOT NULL DEFAULT 'unknown'
                         CHECK (quality_rating IN ('green', 'yellow', 'red', 'unknown')),
  messaging_tier       text,
  status               text NOT NULL DEFAULT 'active',
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_phone_numbers_company ON phone_numbers (client_company_id);
CREATE INDEX idx_phone_numbers_waba ON phone_numbers (waba_id);

-- --------------------------------------------------------------------------
-- TEMPLATES E FLOWS
-- --------------------------------------------------------------------------

CREATE TABLE templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waba_id         uuid NOT NULL REFERENCES wabas(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name            text NOT NULL,
  language        text NOT NULL DEFAULT 'pt_BR',
  category        text NOT NULL
                    CHECK (category IN ('marketing', 'utility', 'authentication')),
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'paused', 'disabled')),
  components      jsonb NOT NULL DEFAULT '{}',
  variables       jsonb NOT NULL DEFAULT '[]',
  meta_template_id text,
  rejection_reason text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (waba_id, name, language)
);
CREATE INDEX idx_templates_product ON templates (product_id);
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE flows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waba_id      uuid REFERENCES wabas(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name         text NOT NULL,
  status       text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'published', 'deprecated')),
  flow_json    jsonb NOT NULL DEFAULT '{}',
  meta_flow_id text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_flows_product ON flows (product_id);
CREATE TRIGGER trg_flows_updated BEFORE UPDATE ON flows
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- MENSAGENS, STATUS E WEBHOOKS
-- --------------------------------------------------------------------------

CREATE TABLE messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES products(id),
  client_company_id uuid NOT NULL REFERENCES client_companies(id),
  phone_number_id   uuid NOT NULL REFERENCES phone_numbers(id),
  direction         text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  wa_message_id     text UNIQUE,                       -- wamid (idempotencia inbound)
  idempotency_key   text,                              -- idempotencia outbound
  to_phone          text,
  from_phone        text,
  type              text NOT NULL,                     -- text/template/interactive/...
  payload           jsonb NOT NULL DEFAULT '{}',
  billing_category  text,
  status            text NOT NULL DEFAULT 'accepted',  -- estado atual de alto nivel
  error_code        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_messages_idempotency
  ON messages (client_company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_messages_company_time ON messages (client_company_id, created_at DESC);
CREATE INDEX idx_messages_phone_time ON messages (phone_number_id, created_at DESC);

-- Uma linha por transicao de estado (sent/delivered/read/failed).
CREATE TABLE message_status (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id  uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  status      text NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  error_code  text,
  occurred_at timestamptz NOT NULL,
  raw         jsonb
);
CREATE INDEX idx_message_status_message ON message_status (message_id);

-- Idempotencia de webhooks: sha256 do corpo bruto.
CREATE TABLE webhook_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash   text NOT NULL UNIQUE,
  status       text NOT NULL DEFAULT 'received'
                 CHECK (status IN ('received', 'processed', 'failed')),
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- --------------------------------------------------------------------------
-- NORMALIZADOR DE MENSAGENS (registry deterministico)
-- --------------------------------------------------------------------------

CREATE TABLE error_catalog (
  code          text PRIMARY KEY,
  motivo        text NOT NULL,
  severidade    text NOT NULL
                  CHECK (severidade IN ('info', 'aviso', 'erro', 'critico')),
  como_corrigir text NOT NULL,
  retryable     boolean NOT NULL DEFAULT false,
  origem        text NOT NULL DEFAULT 'registry'
                  CHECK (origem IN ('registry', 'llm')),
  approved      boolean NOT NULL DEFAULT true,         -- sugestoes do LLM entram como false
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_error_catalog_updated BEFORE UPDATE ON error_catalog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- METRICAS (rollup diario, segmentado por numero e empresa cliente)
-- --------------------------------------------------------------------------

CREATE TABLE message_metrics_daily (
  day               date NOT NULL,
  product_id        uuid NOT NULL,
  client_company_id uuid NOT NULL,
  phone_number_id   uuid NOT NULL,
  billing_category  text NOT NULL DEFAULT 'unknown',
  sent              int NOT NULL DEFAULT 0,
  delivered         int NOT NULL DEFAULT 0,
  read              int NOT NULL DEFAULT 0,
  failed            int NOT NULL DEFAULT 0,
  PRIMARY KEY (day, client_company_id, phone_number_id, billing_category)
);
