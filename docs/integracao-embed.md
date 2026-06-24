# Integração das telas embutíveis (embed)

A central serve quatro telas que um produto da Garagem pode embutir no próprio frontend: `templates`, `flows`, `metrics` e `multitenant`. A renderização acontece dentro de um iFrame isolado servido pela central — o conteúdo é sempre fiel à central e não pode ser alterado pelo app que o embute.

## Modelo de segurança (resumo)

- A **API key** do produto é secreta e vive **somente no backend** do produto.
- O frontend recebe apenas um **embed token** efêmero (JWT, ~10 min) e escopado, gerado a partir da API key. A API key nunca chega ao navegador.
- O iFrame só pode ser embutido em origens declaradas em `allowed_origins` do produto (cabeçalho `Content-Security-Policy: frame-ancestors`).

## Passo 1 — gerar o embed token no backend do produto

```
POST https://<central>/embed/token
Authorization: Bearer mc_live_<sua_api_key>
Content-Type: application/json

{
  "class": "flows",
  "session": "sessao-do-usuario",
  "scope": { "client_companies": ["empresa_123"], "phone_numbers": ["numero_55..."] }
}
```

Resposta:

```json
{ "embed_token": "eyJhbGciOi...", "expires_in": 600, "class": "flows" }
```

O escopo solicitado deve estar contido no escopo da chave; caso contrário, a central responde `403`.

## Passo 2 — embutir a tela no frontend

O desenvolvedor declara **uma `div`** com o `id` da tela (ou `data-garagem-embed`) e inclui o loader. O `embed_token` gerado no passo 1 é injetado pelo backend do produto.

```html
<script src="https://<central>/v1/loader.js"
        data-embed-token="EMBED_TOKEN_GERADO_NO_BACKEND"></script>

<div id="flows" data-session="sessao-do-usuario" data-id="phone:55..."></div>
```

Telas disponíveis (use o `id` correspondente): `templates`, `flows`, `metrics`, `multitenant`.

O loader descobre a `div`, injeta o iFrame apontando para a central e ajusta a altura automaticamente. O conteúdo da tela não pode ser estilizado nem alterado pelo app — apenas o contêiner (a `div`) é dimensionado pelo app.

## Atributos suportados na `div`

| Atributo | Função |
| --- | --- |
| `id` ou `data-garagem-embed` | qual tela renderizar (`templates`/`flows`/`metrics`/`multitenant`) |
| `data-embed-token` | o embed token (alternativa ao atributo no `<script>`) |
| `data-session` | identificador de sessão lógica do usuário |
| `data-id` | recurso/escopo alvo (ex.: `phone:...`, `company:...`) |

## Demonstração

`GET /demo?t=<embed_token>&cls=flows` renderiza uma página host de exemplo que embute a tela.

## Notas

- O embed token expira; o backend do produto deve gerá-lo sob demanda por sessão de usuário.
- Endurecimento futuro: separar a origem do embed em subdomínio dedicado, `script-src` com nonce e denylist de `jti` para revogação imediata.
