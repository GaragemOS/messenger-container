# Arquitetura — messenger-container

Documento de referência do resultado entregue. A plataforma está construída e
implantada em produção (Railway), com as seis fases concluídas e verificadas.

URL de produção: https://messenger-container-production.up.railway.app
Repositório: https://github.com/GaragemOS/messenger-container

## Visão geral

`messenger-container` é o aplicativo Meta único (modelo WhatsApp Business Tech
Provider) que centraliza e normaliza o envio de mensagens para os demais
produtos da Garagem. Hierarquia: Garagem → messenger-container → apps da Garagem
(via chave de API) → clientes finais (empresas/profissionais), cada um com seu
próprio número/WABA.

Stack: TypeScript executado direto no Node 24 (type stripping, sem build no
backend), Fastify, PostgreSQL. Dependências de produção 100% JavaScript puro
(`pg`, `fastify`, `jose`); hash de senha via `scrypt` nativo. Sem etapa de build
nativo no deploy.

## Componentes

| Camada | Função |
| --- | --- |
| Console (`/`, `/console`) | Login interno restrito a `@garagem.dev.br` |
| Auth | Código por e-mail (Resend) → senha (scrypt) → sessão por cookie `__Host-` |
| API keys | Uma chave por produto (`mc_live_<id>.<secret>`), escopada |
| Embed token | JWT Ed25519 efêmero e escopado, cunhado a partir da API key |
| Embed/iFrame | Loader zero-dep + 4 telas isoladas com barreira de segurança |
| Tech Provider | Graph client v25, webhooks, envio, normalizador de erros |
| Multitenant | Empresas clientes, WABAs, números, templates, flows |
| Métricas | Rollup por status/dia e chargeback por categoria de tarifa |

## Endpoints por tipo de autenticação

Sessão de console (cookie):
- `POST /auth/request-code`, `/auth/set-password`, `/auth/login`, `/auth/logout`; `GET /auth/me`
- `POST /api/products`, `GET /api/products`, `POST /api/products/:id/keys`, `GET /api/products/:id/keys`, `POST /api/keys/:id/revoke`

API key do produto (server-to-server, `Authorization: Bearer mc_live_...`):
- `POST /embed/token` — cunha o embed token escopado
- `POST /v1/tenants`, `GET /v1/tenants`, `POST /v1/tenants/:id/wabas`, `POST /v1/wabas/:id/numbers`
- `POST /v1/templates` (com validação), `GET /v1/templates`, `POST /v1/flows`, `GET /v1/flows`
- `GET /v1/metrics`, `GET /v1/normalize/:code`

Embed token (chamado pelas telas dentro do iFrame):
- `GET /v1/embed/context`, `/v1/embed/templates`, `/v1/embed/flows`, `/v1/embed/multitenant`, `/v1/embed/metrics`

Público / infra:
- `GET /v1/loader.js`, `GET /v1/screen/:class`, `GET /demo`
- `GET /webhooks/whatsapp` (handshake), `POST /webhooks/whatsapp` (assinatura + idempotência)
- `GET /healthz`, `GET /readyz`

## Modelo de segurança

- **Domínio:** console restrito a `@garagem.dev.br` (match exato, sem subdomínio/bypass).
- **Senha/sessão:** scrypt; sessão opaca em cookie `__Host-` (HttpOnly, Secure, SameSite=Strict); rate-limit e anti-enumeração.
- **API key:** só `sha256(secret)` no banco; comparação em tempo constante; revogação.
- **Embed token:** a API key secreta nunca chega ao navegador. O token é efêmero (10 min), escopado por produto/empresa/número, validado server-side.
- **Embed/iFrame:** isolamento por origem; `Content-Security-Policy: frame-ancestors` por produto; `postMessage` com checagem de origem; `Referrer-Policy: no-referrer`; `Cache-Control: no-store`.
- **Webhooks:** validação `X-Hub-Signature-256` (HMAC sobre corpo bruto) + idempotência; resposta 200 rápida e processamento assíncrono.
- **Geral:** `X-Content-Type-Options: nosniff` em todas as respostas.

## Modelo de dados (PostgreSQL)

`users`, `email_verification_codes`, `sessions`, `auth_rate_limits` · `products`,
`api_keys` · `client_companies`, `wabas`, `phone_numbers` · `templates`, `flows`
· `messages`, `message_status`, `webhook_events` · `error_catalog`,
`pricing_rates`, `message_metrics_daily`. Isolamento por `client_company_id` +
`phone_number_id` nas tabelas quentes. Migrations em SQL puro aplicadas no boot.

## Mapeamento requisitos → entrega

| Requisito | Entrega |
| --- | --- |
| Token por empresa da Garagem | API key por produto, com escopo e revogação |
| Normalizador de erros/motivos/correção | Registry determinístico + fallback LLM opcional |
| Dados por empresa | Multitenant (empresas/números) isolado por escopo |
| Templates e flows pré-cadastrados servidos pela API | CRUD com validação + endpoints de listagem |
| Telas de iFrame com barreira de segurança | Loader + 4 telas isoladas + CSP/token efêmero |
| Acesso só `@garagem.dev.br` (código → senha) | Auth do console implementada |
| Open source no Git da Garagem | `GaragemOS/messenger-container` (público) |
| Projeto no Railway, só `main` | Implantado (ambiente `production`) |
| Multitenant/Métricas por número e empresa | Telas e endpoints escopados |

## Pendências (dependem de credenciais Meta)

O envio real e o recebimento de webhooks assinados exigem o app aprovado e as
variáveis `META_APP_SECRET`, `META_SYSTEM_USER_TOKEN`. O código e a lógica estão
prontos e testados com mocks; resta ligar as credenciais. Itens de
endurecimento futuro: subdomínio dedicado para o embed, `script-src` com nonce,
e denylist de `jti` para revogação imediata do embed token.

## Operação

- Deploy: `railway up -s messenger-container --ci` (build railpack, Node 24 via `.nvmrc`); migrations rodam no boot.
- Verificação: `npm run typecheck`, `npm test` (42 casos), `GET /healthz` e `/readyz`.
- Variáveis sensíveis no Railway, nunca no repositório (`.env.example` documenta todas).
