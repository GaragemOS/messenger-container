# Respostas de Flow: payload de referência e simulação

Este documento descreve para onde vai o payload de um WhatsApp Flow e fornece um
payload de referência para que o desenvolvimento do lado consumidor possa
continuar sem depender de tráfego real da Meta.

## Modos de Flow

Um Flow pode operar em dois modos, com destinos de payload diferentes:

1. **Sem endpoint (estático)** — é o modo gerado pelo construtor visual hoje. A
   navegação entre telas é definida no Flow JSON (ações `navigate`) e o botão
   final (`Footer`) usa a ação `complete`. Não há `data_channel_uri`. Quando o
   usuário finaliza, o WhatsApp empacota todas as respostas e entrega **pelo
   webhook** da central, como uma mensagem `interactive` do tipo `nfm_reply`.

2. **Com endpoint (dinâmico)** — o Flow declara `data_channel_uri` e usa ações
   `data_exchange`. A cada troca, os servidores do WhatsApp chamam um endpoint
   HTTPS próprio (corpo criptografado com AES-128-GCM + RSA-2048 e um
   health-check). Este modo **não é usado** pela plataforma atualmente.

## Onde o payload chega

No modo estático, a resposta chega no endpoint de webhook já existente:

- Rota: `POST /webhooks/whatsapp` (`src/http/routes/webhooks.ts`).
- Validação de assinatura `X-Hub-Signature-256` sobre o corpo bruto
  (`src/whatsapp/signature.ts`).
- Extração de eventos: `extractEvents` (`src/whatsapp/webhooks.ts`) reconhece a
  resposta de Flow e emite um evento `flow_response` com:
  - `flowToken`: o `flow_token` definido no envio, usado para correlacionar a
    sessão/cliente/produto de origem;
  - `response`: objeto já desserializado a partir de `nfm_reply.response_json`,
    com um campo por input do Flow (a chave é o `name` do componente).

## Payload de referência (resposta de Flow finalizado)

O `response_json` é uma **string** com JSON dentro (campos do formulário +
`flow_token`). As chaves correspondem ao `name` de cada input do Flow.

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID_EXEMPLO",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "PHONE_NUMBER_ID_EXEMPLO"
            },
            "contacts": [
              { "profile": { "name": "Cliente Teste" }, "wa_id": "5511988887777" }
            ],
            "messages": [
              {
                "from": "5511988887777",
                "id": "wamid.EXEMPLO==",
                "timestamp": "1700000000",
                "type": "interactive",
                "interactive": {
                  "type": "nfm_reply",
                  "nfm_reply": {
                    "name": "flow",
                    "body": "Sent",
                    "response_json": "{\"flow_token\":\"flw_demo_123\",\"nome\":\"Texto de exemplo\",\"email\":\"cliente@exemplo.com\",\"plano\":\"0\"}"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

No console, o botão **"Payload de teste"** dentro do construtor de Flows gera
exatamente este payload já com os campos do Flow que está sendo editado (cada
input vira uma chave em `response_json`, com um valor de exemplo conforme o
tipo). Use-o como referência fixa enquanto desenvolve o consumo.

## Simular localmente

A rota de webhook valida a assinatura, então a simulação exige `META_APP_SECRET`
configurado e o header `X-Hub-Signature-256` calculado sobre o corpo bruto.

Gere a assinatura e dispare o webhook (exemplo em Node):

```js
import { createHmac } from "node:crypto";

const secret = process.env.META_APP_SECRET;          // mesmo valor da Railway/dev
const body = JSON.stringify(/* cole aqui o payload de referência */);
const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

await fetch("http://localhost:8080/webhooks/whatsapp", {
  method: "POST",
  headers: { "content-type": "application/json", "x-hub-signature-256": sig },
  body,
});
```

O ingestor responde `200` rápido e processa de forma assíncrona; o evento
`flow_response` aparece no log (`webhook processado`). A partir daí, a etapa
seguinte é rotear `response` para o produto dono do Flow (callback por produto)
usando o `flowToken` para correlação.
