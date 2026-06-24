# messenger-container

Plataforma central de mensageria da Garagem. É o único aplicativo aprovado pela Meta (modelo **WhatsApp Business Tech Provider**) e funciona como camada de API que normaliza e centraliza o envio de mensagens para os demais produtos da empresa, evitando a necessidade de aprovar um novo aplicativo na Meta a cada produto.

> Status: em construção. Consulte `docs/estudo-whatsapp-business-platform.md` para o estudo técnico que fundamenta a arquitetura.

## Visão geral

Hierarquia de três camadas:

```
Garagem (empresa)
  └── messenger-container        ← único app Meta aprovado (Tech Provider)
        ├── App da Garagem #1     ← consome a central via chave de API
        │     └── Clientes finais (profissionais/empresas) com número/WABA próprios
        ├── App da Garagem #2
        └── App da Garagem #3
```

A central oferece:

- **Token (chave de API) por produto** da Garagem, com escopo por número de WhatsApp e empresa cliente.
- **Normalizador de mensagens**: traduz erros, motivos e estados da API da Meta para um formato consistente (`motivo`, `severidade`, `comoCorrigir`).
- **Templates e Flows** pré-cadastrados, servidos pela API.
- **Telas embutíveis via iFrame** (templates, flows, métricas, multitenant) com barreira de segurança, para uso dentro dos produtos da Garagem.
- **Console interno** de gestão, com acesso restrito ao domínio `@garagem.dev.br`.

## Stack

TypeScript (Node 24, sem etapa de build no backend — execução direta via type stripping), Fastify, PostgreSQL (`pg`, migrations em SQL puro), Resend (e-mail). Dependências mantidas ao mínimo.

## Desenvolvimento

Pré-requisitos: Node 24+ e um PostgreSQL acessível.

```bash
npm install
cp .env.example .env      # preencha DATABASE_URL e demais variáveis
npm run migrate           # aplica o schema
npm run dev               # sobe o servidor em http://localhost:3000
```

Scripts:

| Script | Ação |
| --- | --- |
| `npm run dev` | Servidor em modo watch. |
| `npm start` | Servidor (produção). |
| `npm run migrate` | Aplica migrations pendentes. |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`). |
| `npm test` | Suíte de testes (runner nativo do Node). |

Health checks: `GET /healthz` (liveness) e `GET /readyz` (readiness, valida o banco).

## Integração das telas embutíveis (prévia)

Os produtos da Garagem embutem uma tela declarando uma `div` com o `id` correspondente e incluindo o loader. A renderização é feita pela central dentro de um iFrame isolado — o conteúdo é sempre fiel à central e não pode ser alterado pelo app que o embute.

```html
<script src="https://embed.garagem.dev/v1/loader.js"
        data-embed-token="EMBED_TOKEN_EFEMERO_GERADO_NO_SEU_BACKEND"></script>

<div id="flows" data-session="sess_abc" data-id="phone:..."></div>
```

Telas disponíveis: `templates`, `flows`, `metrics`, `multitenant`. O `embed-token` é efêmero e escopado, gerado no backend do produto a partir da sua chave de API secreta (que nunca vai ao navegador). Detalhes na documentação de integração (em construção).

## Licença

MIT.
