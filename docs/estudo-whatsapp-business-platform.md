# Estudo: WhatsApp Business Platform — Fundamentos para a Plataforma de Mensageria

> Documento de pesquisa técnica para fundamentar a construção da plataforma interna de APIs de mensagens (`messenger-container`). Base para decisões de arquitetura e para a jornada de aprovação na Meta. Nenhum código foi desenvolvido nesta fase — este é o material de estudo.

## Legenda de confiança

- **[V]** Verificado nesta pesquisa por votação adversarial (≥ 3 fontes / 3-0), majoritariamente documentação **primária** da Meta.
- **[V-sec]** Verificado, mas a fonte é secundária (blog/provedor); tratar como "caminho típico", não garantia contratual.
- **[D]** Conhecimento de domínio complementar (não verificado nesta rodada) — confirmar na documentação oficial antes de codar.
- **[?]** Questão em aberto que precisa ser resolvida antes da implementação (ver Seção M).

---

## 0. Resumo executivo e decisões-chave

1. **A Cloud API é o único caminho.** A On-Premises API foi totalmente descontinuada (última versão expirou em **23/out/2025**). A Cloud API, hospedada pela própria Meta, é o caminho oficial e recomendado. Isso elimina qualquer ideia de self-hosting do cliente Docker do WhatsApp. **[V]**

2. **Modelo na Meta:** um único app "guarda-chuva" gerenciando múltiplos WABAs/números da própria empresa. As três permissões centrais são `whatsapp_business_messaging`, `whatsapp_business_management` e (provavelmente) `business_management`. **[V]**

3. **Topologia (definida em 2026-06-24): cada cliente final tem o próprio número/WABA.** Ver a Seção A.0 (hierarquia). O *quality rating*, o *messaging tier* e o *throughput* (80 MPS) são **por número**, mas como cada cliente final tem o próprio número, a qualidade fica **isolada por cliente** — não há contaminação cruzada entre clientes. (A topologia "números compartilhados entre produtos" cogitada no kickoff foi descartada.)

4. **App Review é quase certamente obrigatório** no contexto que você descreveu, e a causa nº 1 de rejeição é pedir permissões desnecessárias. Pedir só o que precisa. **[V]**

5. **Arquitetura de chave-por-produto é um padrão consagrado** (360dialog, Bird/MessageBird, Twilio). A abstração que você quer — uma interface única que normaliza payloads e roteia por canal — é validada por esses provedores e pela guidance oficial de multi-tenancy do Azure. **[V]**

---

## A.0 Arquitetura de hierarquia e modelo Tech Provider (definida em 2026-06-24)

O `messenger-container` é o **único app Meta aprovado** (faz App Review uma vez) e atua como **Tech Provider**, centralizando toda a comunicação e normalização com a WhatsApp Business API. A hierarquia tem três camadas:

```
GARAGEM (empresa)  ──►  Business Portfolio / Meta Business Manager
   └── messenger-container  ──►  ÚNICO App Meta aprovado (Tech Provider). App Review 1x.
         ├── App da Garagem #1 (ex: SaaS p/ psicólogos)  ──► consome via API key
         │      └── Cliente final (Dr. João)  ──► WABA + número próprios do cliente
         ├── App da Garagem #2 (ex: marketing)            ──► consome via API key
         │      └── Cliente final (Agência Y)  ──► WABA + número próprios do cliente
         └── App da Garagem #3 (ex: saúde)                ──► consome via API key
```

**Consequências:**

- Os apps da Garagem (#1, #2, #3) **nunca** vão à Meta — só consomem a central via chave de API. Objetivo de "um único app aprovado" atendido. **[V]**
- Cada **cliente final** entra como *business customer* onboarded via **Embedded Signup** (popup oficial), com WABA/número próprios. **[V]**
- **Onboarding de número de terceiro NÃO é 100% silencioso:** exige (1) consentimento único do dono via Embedded Signup/OAuth e (2) verificação de posse do número (código SMS/ligação). **Depois disso**, a gestão é programática (registrar, enviar, ler status). **[D/V]**
- **Decisão pendente — BYON vs número provisionado:** cliente traz o próprio número (mais fricção, exige migração) **ou** a Garagem provisiona número novo no próprio Business Portfolio (quase 100% automático, mas número é "da Garagem"). **[?]**
- **Limites de onboarding:** 10 novos clientes / 7 dias por padrão; sobe para **200 / 7 dias** com Business Verification + App Review + Access Verification. **[V]**

**Billing (define o nível de parceria):**

| Modelo | Quem paga a Meta | Quando usar |
|---|---|---|
| **Tech Provider** (recomendado p/ começar) | Cada cliente final adiciona método de pagamento e paga a Meta direto. Sem markup. | Lançamento rápido; sem taxa de entrada. |
| **Solution Partner** (ex-BSP, futuro) | Garagem tem linha de crédito, paga a Meta e **fatura o cliente** (white-label). | Quando quiser absorver o billing e revender embutido no preço. |

> **Custo de ser parceiro:** não há taxa/licença da Meta para virar Tech Provider — paga-se apenas por mensagem (e, no modelo TP, quem paga é o cliente). Business Verification, App Review e Access Verification são gratuitos (processo + documentos). Solution Partner é um nível mais alto, sem preço de tabela público, com requisitos de qualificação (passar por Tech Provider → Tech Partner). O "markup de 5–20% / onboarding fee" associado a BSP é o que o BSP **cobra dos clientes** (receita), não uma taxa que a Meta cobra de você. **[V / V-sec]**

---

## A. Jornada de aprovação na Meta (Tech Provider)

### Permissões centrais **[V]**

| Permissão | O que concede | Observação para a plataforma |
|---|---|---|
| `whatsapp_business_messaging` | Enviar mensagens, upload/recuperar mídia, gerenciar perfil comercial, registrar número | Cobre o **envio efetivo**. Depende de `whatsapp_business_management`. |
| `whatsapp_business_management` | Ler/gerenciar WABAs, números, **templates**, QR codes, assinaturas de webhook | Cobre toda a **gestão centralizada** que a plataforma faz. |
| `business_management` | Ler/escrever ativos via Business Manager API | Tipicamente necessária no fluxo Tech Provider para reivindicar/gerenciar ativos de negócio. |

### Checklist de pré-requisitos para aprovação **[V / V-sec]**

- [ ] Criar **Meta Business Manager** (Business Portfolio) da empresa.
- [ ] Completar **Business Verification** (verificação de negócio) — tipicamente **2–5 dias úteis** **[V-sec]**; casos com divergência de documentos podem ir a 1–2 semanas.
- [ ] Criar o **App** do tipo *Business* no Meta for Developers.
- [ ] Adicionar o produto **WhatsApp** ao app.
- [ ] Solicitar **apenas** `whatsapp_business_messaging` + `whatsapp_business_management` (+ `business_management` se for gerenciar ativos no nível de negócio). **Não pedir permissões a mais** — é a causa nº 1 de rejeição. **[V]**
- [ ] Configurar **System User** e gerar token (ver Seção H).
- [ ] Submeter **App Review** com exemplos concretos e específicos de uso de cada permissão. Decisão típica em **~5 dias** **[V-sec]**.

### Standard Access vs Advanced Access **[D / ?]**

- **Standard Access:** opera apenas nos ativos do próprio app, com limites (modo de desenvolvimento/teste). Não exige App Review.
- **Advanced Access:** necessário para operar em escala e/ou agir em nome de negócios. **Exige App Review.**
- **No seu caso** (app único servindo múltiplos produtos internos): mesmo sendo tudo da mesma empresa, a operação em escala empurra para **Advanced Access → App Review obrigatório**. A classificação exata é uma questão em aberto (ver Seção M, item 1).

---

## B. Cloud API vs On-Premises + versionamento

- **On-Premises:** totalmente descontinuada. Desde **jan/2024 (v2.53)** só recebia correções de bug; a última versão de cliente **expirou em 23/out/2025**. Não dá mais para enviar mensagens por ela. **[V]**
- **Cloud API:** hospedada pela Meta, é o caminho oficial recomendado. Sem cliente Docker para manter — simplifica a infraestrutura. **[V]**
- **Versionamento (Graph API):** a Cloud API roda sobre a Graph API. Versão mais recente: **v25.0** (18/fev/2026). Cada versão é suportada por **~2 anos** antes de expirar. **[V]**
  - **Decisão:** fixar a versão na URL dos endpoints (ex.: `/v25.0/...`) e criar um processo de revisão a cada ~18 meses para migrar antes da expiração. Novas versões saem a cada ~4 meses. **[V]**

---

## C. Estrutura WABA e o problema dos números compartilhados

### Hierarquia **[D]**

```
Business Portfolio (Meta Business Manager)
  └── WhatsApp Business Account (WABA)
        └── Phone Number(s)  ← quality rating, messaging tier e throughput vivem AQUI
              └── Display Name (aprovado pela Meta)
              └── Message Templates
```

### Messaging tiers (limite de conversas business-initiated em 24h, por número) **[D — confirmar]**

| Tier | Conversas business-initiated únicas / 24h |
|---|---|
| Inicial (não verificado) | ~250 |
| Após verificação | 1.000 |
| Escala automática | 10.000 |
| Escala automática | 100.000 |
| Topo | Ilimitado |

O escalonamento é automático, baseado em **volume** e **quality rating** (verde/amarelo/vermelho). Qualidade ruim **rebaixa** o tier.

### Risco da topologia "números compartilhados" (ponto de atenção) **[V para os limites / ? para a contaminação]**

A escolha de poucos números servindo muitos produtos tem três implicações sérias, porque **tudo o que importa é por número**:

1. **Contaminação cruzada de qualidade:** o *quality rating* é do número. Se um produto dispara marketing de baixa qualidade e recebe bloqueios/reclamações, **o tier e a entrega de TODOS os produtos daquele número caem juntos.** **[?]** (mecanismo exato não detalhado na pesquisa, mas o rating ser por-número é fato **[V]**).
2. **Throughput dividido:** os 80 MPS (ver Seção I) são do número. Vários produtos disputam a mesma fila física. **[V]**
3. **Identidade única:** cada número tem **um** display name e **um** perfil comercial. Produtos com marcas diferentes não conseguem se apresentar de forma distinta no mesmo número.

> **Recomendação:** reconsiderar para um modelo **híbrido** — agrupar por *marca/risco de qualidade* em vez de espremer tudo em um número. Ex.: um número para mensagens transacionais (utility/authentication, alta qualidade) e número(s) separado(s) para marketing. A plataforma de chave-por-produto continua funcionando; só muda o mapeamento `produto → número`. Decisão de negócio que vale discutir antes de implementar.

---

## D. Templates (HSM / message templates)

### Categorias **[V para o modelo de categorias]**

- **Marketing** — promoções, novidades (mais caro; mais sujeito a qualidade/opt-out).
- **Utility** — confirmações, atualizações de pedido/conta, lembretes (transacional).
- **Authentication** — OTP / códigos de verificação.
- **Service** — mensagens de atendimento dentro da janela de 24h (não é template; é mensagem de sessão).

### Componentes **[D]**

`header` (texto/mídia/documento/localização) · `body` (com variáveis `{{1}}`, `{{2}}`...) · `footer` · `buttons` (quick reply, call-to-action URL/telefone, copy-code).

### Gestão de muitos templates sob poucos números **[D]**

- Templates pertencem ao **WABA**, e são reutilizáveis entre números do mesmo WABA.
- Aprovação é por template (categoria + conteúdo). Categorização errada é remarcada pela Meta e pode encarecer.
- **Para a plataforma:** namespacing por produto (ex.: prefixo `produto_evento`) e um registry interno mapeando `produto → templates permitidos` evita um produto usar template de outro. Pausa por qualidade também é por template.

---

## E. Pricing

- **Mudança de 2025:** o modelo migrou de *conversation-based* (cobrança por conversa de 24h) para **per-message** para templates. **[V para o modelo de categorias]**
- **IMPORTANTE — mito refutado:** a alegação de que "a janela de 24h acabou" é **FALSA** (refutada 0-3). A **janela de 24h continua valendo**: mensagens de **serviço/sessão dentro dela permanecem grátis**. **[V]**
- **Categorias de cobrança:** marketing, utility, authentication (cobradas por mensagem de template) + service (grátis na janela de 24h). **[V]**
- **Atualização trimestral:** a Meta revisa as tabelas em **jan/abr/jul/out**. As cifras envelhecem rápido (ex.: Alemanha marketing €0,1131, utility/auth €0,0456 no modelo 2025 → já revisado para €0,0550 em abr/2026). **[V-sec]**
  - **Decisão de engenharia:** **nunca** fixar preço no código. A plataforma deve puxar a tabela vigente e **rastrear custo por produto/template/categoria/país** para chargeback interno (mesmo compartilhando números).

---

## F. Webhooks

### Verificação do endpoint (handshake) **[V]**

A Meta faz um `GET` com `hub.mode=subscribe`, `hub.challenge` (um inteiro) e `hub.verify_token`. O endpoint deve: validar que o `verify_token` bate com o configurado no App Dashboard e **responder ecoando o `hub.challenge`** como texto puro, HTTP 200.

### Validação de assinatura **[V]**

- Todo payload vem assinado no header **`X-Hub-Signature-256`**, prefixado com `sha256=`.
- Validação: gerar HMAC-SHA256 do **corpo RAW** (antes do parse JSON!) usando o **App Secret** do app e comparar com o header.
- **Detalhe crítico da arquitetura guarda-chuva:** a chave é o **App Secret** (um só), não uma chave por-WABA. Todos os webhooks de todos os produtos/números chegam ao **mesmo endpoint** e são validados com o **mesmo segredo**. O roteamento por produto acontece *depois*, lendo o WABA/número do payload.
- **Pitfall:** usar o corpo bruto (a Meta usa encoding Unicode escapado); fazer `JSON.parse` antes de calcular o HMAC quebra a validação.

### Boas práticas **[V/D]**

Responder **200 rápido** → enfileirar → processar **assíncrono** com **idempotência/deduplicação** (a Meta pode reenviar o mesmo evento).

---

## G. Envio de mensagens **[D — confirmar nos docs antes de codar]**

- **Tipos:** `text`, mídia (`image`/`audio`/`video`/`document`/`sticker`), `interactive` (buttons, list, CTA url), `template`, `location`, `contacts`, `reaction`.
- **Regra da janela de 24h:**
  - Dentro de 24h da última mensagem do usuário → **mensagens de sessão livres** (qualquer tipo).
  - Fora da janela → **só template** (pré-aprovado).
- **Mídia:** fazer upload uma vez (recebe `media_id`) e **reusar** o id em vários envios, em vez de reenviar bytes.
- **Estados de entrega:** `sent` → `delivered` → `read` (+ `failed`). Chegam via webhook de `statuses`. **[?]** — os códigos de erro específicos não foram cobertos nesta pesquisa (Seção M, item 4).

---

## H. Segurança e compliance **[D — pouco coberto pela pesquisa; ver Seção M item 3]**

- **System User token** (não token de usuário pessoal): criar um System User no Business Manager, atribuir o app e os ativos (WABAs), gerar **token de longa duração**. É o que a plataforma usa para chamar a API.
- **Rotação:** planejar rotação periódica de token e armazenamento seguro (secret manager / variáveis de ambiente, nunca no código).
- **Opt-in:** a WhatsApp Business Messaging Policy **exige consentimento explícito** do usuário antes de receber mensagens business-initiated. A plataforma deve registrar e auditar opt-in **por produto**.
- **Legal:** a Meta exige **Privacy Policy URL** (e tipicamente Terms) no app, além de aderência à Commerce Policy. **[?]** — detalhes exatos a confirmar.

---

## I. Rate limits e throughput

- **Throughput:** **80 mensagens/segundo (MPS) por número** por padrão; até **1.000 MPS** com upgrade (4x o nível antigo da On-Premises — é a plataforma de maior throughput da Meta). **[V]**
- **Elegibilidade para upgrade:** tipicamente tier ilimitado + 100k+ destinatários únicos/24h + quality rating verde/amarelo. **[V-sec]**
- **Caso especial:** números *coexistence* são fixos em **20 MPS** e **não** podem ser upgradados. **[V]**
- **Implicação para números compartilhados:** os 80 MPS são **por número**, divididos entre todos os produtos daquele número → a plataforma precisa de **throttling/fila por número** (não só por produto), senão estoura o limite. **[V]**
- **[?]** Os *business-use-case rate limits* (limites de **chamadas de API por hora**, distintos do throughput de mensagens) não foram detalhados — ver Seção M, item 4.

---

## J. WhatsApp Flows nativo (vs builder próprio por iFrame)

- **O que é:** produto **oficial** da Meta para experiências interativas estruturadas **dentro do chat** (formulários/menus: text input, dropdown, date picker, radio/checkbox, OTP, upload de imagem). **[V]**
- **Casos de uso oficiais:** lead gen de produtos financeiros (empréstimo pré-aprovado), cotação de seguro, captura de intenção de compra, ofertas personalizadas. **[V]**
- **Trade-off vs o builder próprio (iFrame):**
  - **iFrame próprio:** controle total de UI/UX, independência da Meta, bom para **demonstração inicial**. Mas o usuário sai do chat para uma webview externa.
  - **Flows nativo:** renderiza **dentro do WhatsApp** (sem sair) → tende a dar **maior conversão e confiança**. Custo: amarra ao formato/componentes da Meta e ao processo de publicação/aprovação de Flows.
  - **Recomendação:** começar com o iFrame próprio para a demo; avaliar migração ao Flows nativo quando a conversão in-chat virar prioridade.

---

## K. Arquitetura recomendada para a plataforma multi-produto

### Modelo de credenciais **[V — inspirado em 360dialog]**

A 360dialog usa um **Partner ID** (nível plataforma) + **uma API key por número/canal**. Para o seu caso (números compartilhados), **inverter**: gerar **uma API key por PRODUTO** e mapear cada key → conjunto permitido de `(WABA, número, templates)`. Isso dá isolamento lógico por produto sobre infraestrutura compartilhada.

### Multi-tenancy (modelo híbrido) **[V — Azure Architecture Center]**

- Filas/tópicos **compartilhados** para o core assíncrono (envio, status), reduzindo TCO.
- **Throttling/rate limiting por produto E por número** na fila de envio — é a mitigação recomendada contra **noisy neighbor** (um produto de alto volume consumindo os 80 MPS e degradando os demais).

### Normalização de canal (interface única) **[V — Bird/MessageBird Channels API]**

A Bird abstrai SMS, Email, WhatsApp, Telegram etc. atrás de **um endpoint** ("One API, every channel"). Padrão a seguir:

- Definir um **contrato de mensagem canal-agnóstico**: `{ destinatário, tipo de conteúdo, parâmetros, metadados }`.
- **Adaptadores por canal** convertem o contrato no payload específico (Cloud API hoje; SMS/email/Telegram depois) **sem mudar a interface** que os produtos internos consomem.

### Componentes mínimos sugeridos

1. **API Gateway interno** — autentica a API key do produto, valida escopo (`produto → números/templates permitidos`).
2. **Normalizador de payload** — contrato canal-agnóstico → adaptador WhatsApp.
3. **Fila de envio** — com retry/backoff exponencial, **idempotência** (dedupe por chave de mensagem) e throttling por número/produto.
4. **Webhook ingestor** — endpoint único, valida `X-Hub-Signature-256`, responde 200 rápido, enfileira para processamento.
5. **Store de status** — persiste `sent/delivered/read/failed` por mensagem, exposto aos produtos.
6. **Registry de configuração** — produtos, keys, mapeamento de números/templates, tabela de pricing vigente para chargeback.

---

## L. Roadmap de canais futuros (benchmark) **[V]**

| Provedor | Padrão relevante |
|---|---|
| **360dialog** | Credencial em camadas: Partner ID + API key por canal/número. Inspira o modelo de chaves. |
| **Bird (MessageBird)** | Channels API omnichannel — interface única para SMS/Email/WhatsApp/Telegram. Inspira a normalização. |
| **Twilio** | API unificada de mensageria sobre múltiplos canais; referência de abstração madura. |

Conclusão: a abstração que você quer é o padrão de mercado. Construir o contrato canal-agnóstico **desde o início** evita reescrita quando entrar SMS/email/Telegram.

---

## M. Questões em aberto (resolver antes de implementar)

1. **[RESOLVIDO em 2026-06-24]** O modelo é **Tech Provider** (Advanced Access, App Review obrigatório). A central onboarda WABAs/números de clientes terceiros (psicólogos, agências, clínicas) via Embedded Signup. Ver Seção A.0.
2. **Contaminação cruzada em números compartilhados:** como exatamente o quality rating e o tier de um número reagem quando um produto degrada a qualidade? Determina se a topologia compartilhada é segura. **Ação:** validar antes de fixar a topologia.
3. **Compliance/legal e tokens:** detalhes de Privacy Policy/Terms exigidos, regras de opt-in da Messaging/Commerce Policy para multi-produto, e mecânica de rotação de System User token de longa duração. **Ação:** estudo dedicado da Seção H.
4. **Erros e rate limits de chamada:** catálogo de códigos de erro de entrega (`failed`) e os *business-use-case rate limits* (chamadas de API/hora, distintos dos 80 MPS). **Ação:** estudo dedicado das Seções G e I.

---

## N. Próximos passos recomendados

1. **Decidir a topologia de números** (compartilhado puro vs híbrido por marca/risco) — é a decisão de maior impacto e a mais barata de mudar agora. (Seção C)
2. **Resolver a classificação Meta** (questão M1) para dimensionar a jornada de aprovação.
3. **Abrir o Business Manager e iniciar Business Verification** — é o item de maior lead time (2–5 dias, pode esticar). Começar cedo destrava todo o resto.
4. **Modelar o contrato canal-agnóstico** no papel (a interface que os produtos vão consumir) — define a fundação da plataforma e do builder de flows.
5. **Rodar uma segunda pesquisa focada** nas questões em aberto M3 e M4 (compliance + erros/rate limits), que ficaram com pouca cobertura.
6. Só então: prototipar o **fluxo de envio mínimo** (1 número, 1 template, webhook de status) como prova de conceito antes de generalizar para multi-produto.

---

## Fontes principais (documentação primária da Meta)

- Permissões: https://developers.facebook.com/documentation/business-messaging/whatsapp/permissions/
- Sunset On-Premises: https://developers.facebook.com/docs/whatsapp/on-premises/sunset
- Changelog Graph API: https://developers.facebook.com/docs/graph-api/changelog/versions/
- Webhooks (setup): https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/
- Throughput: https://developers.facebook.com/documentation/business-messaging/whatsapp/throughput/
- WhatsApp Flows: https://developers.facebook.com/docs/whatsapp/flows/
- Multi-tenancy (Azure): https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/messaging
- 360dialog Partner API: https://docs.360dialog.com/partner/api-reference/partner-api
- Bird Channels API: https://docs.bird.com/api/channels-api

_Fontes secundárias (prazos de aprovação, cifras de pricing) usadas com ressalva — ver legenda [V-sec]._
