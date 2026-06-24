// Documento HTML servido dentro do iframe (uma das 4 telas). O conteudo e fiel
// a central e isolado por origem; nao pode ser alterado pelo app que o embute.
// Frontend sem comentarios; placeholders __TOKEN__/__CLASS__/__TITLE__/__DESC__
// sao injetados ao servir. Dados reais das telas chegam nas fases 4-6.

const TITLES: Record<string, { title: string; desc: string }> = {
  templates: { title: "Templates", desc: "Gerencie os templates de mensagem do produto." },
  flows: { title: "Flows", desc: "Construa e gerencie os fluxos interativos." },
  metrics: { title: "Metricas", desc: "Acompanhe envios por numero e empresa cliente." },
  multitenant: { title: "Multitenant", desc: "Gerencie empresas clientes e numeros de WhatsApp." },
};

export function screenShellHtml(cls: string, token: string): string {
  const meta = TITLES[cls] ?? { title: cls, desc: "" };
  return SHELL.replace(/__TOKEN__/g, token)
    .replace(/__CLASS__/g, cls)
    .replace(/__TITLE__/g, meta.title)
    .replace(/__DESC__/g, meta.desc);
}

const SHELL = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Garagem · __TITLE__</title>
<style>
  :root {
    --primary:#4F46E5; --on-primary:#fff; --surface:#FBFAFF; --surface-container:#fff;
    --on-surface:#1B1B21; --on-surface-variant:#5A5A66; --outline:#E2E1E8; --primary-container:#E5E0FF;
  }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    background:var(--surface); color:var(--on-surface); }
  .wrap { padding:20px; }
  .head { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
  .badge { width:40px; height:40px; border-radius:12px; background:var(--primary-container);
    color:var(--primary); display:grid; place-items:center; font-weight:700; }
  h1 { font-size:20px; margin:0; }
  .desc { color:var(--on-surface-variant); font-size:14px; margin:2px 0 0; }
  .card { background:var(--surface-container); border:1px solid var(--outline);
    border-radius:16px; padding:16px; margin-top:14px; }
  .card h2 { font-size:13px; text-transform:uppercase; letter-spacing:.5px;
    color:var(--on-surface-variant); margin:0 0 10px; }
  .row { display:flex; justify-content:space-between; gap:12px; padding:6px 0; font-size:14px;
    border-bottom:1px solid var(--outline); }
  .row:last-child { border-bottom:0; }
  .row .k { color:var(--on-surface-variant); }
  .row .v { font-weight:600; word-break:break-all; text-align:right; }
  .note { font-size:13px; color:var(--on-surface-variant); margin-top:14px; }
  .err { color:#BA1A1A; }
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div class="badge" id="badge"></div>
    <div>
      <h1>__TITLE__</h1>
      <p class="desc">__DESC__</p>
    </div>
  </div>
  <div id="content"></div>
</div>
<script>
  var TOKEN = "__TOKEN__";
  var CLASS = "__CLASS__";
  var PARENT = document.referrer ? new URL(document.referrer).origin : "*";

  document.getElementById("badge").textContent = CLASS.charAt(0).toUpperCase();

  function postHeight() {
    parent.postMessage({ type: "garagem:resize", height: document.body.scrollHeight }, PARENT);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function row(k, v) {
    var r = el("div", "row");
    r.appendChild(el("span", "k", k));
    r.appendChild(el("span", "v", v));
    return r;
  }
  function render(ctx) {
    var content = document.getElementById("content");
    content.textContent = "";
    var card = el("div", "card");
    card.appendChild(el("h2", null, "Contexto da sessao"));
    card.appendChild(row("Produto", ctx.product));
    card.appendChild(row("Tela", ctx.class));
    card.appendChild(row("Sessao", ctx.session || "-"));
    card.appendChild(row("Empresas", (ctx.scope && ctx.scope.client_companies || []).join(", ")));
    card.appendChild(row("Numeros", (ctx.scope && ctx.scope.phone_numbers || []).join(", ")));
    content.appendChild(card);
    content.appendChild(el("p", "note",
      "Tela conectada com sucesso. Os dados de " + CLASS + " serao carregados nas proximas fases."));
    postHeight();
  }
  function fail(msg) {
    var content = document.getElementById("content");
    content.textContent = "";
    content.appendChild(el("p", "note err", msg));
    postHeight();
  }
  function load() {
    if (!TOKEN) { fail("Token de embed ausente ou invalido."); return; }
    fetch("/v1/embed/context", { headers: { authorization: "Bearer " + TOKEN } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(render)
      .catch(function () { fail("Sessao invalida ou expirada. Recarregue a tela."); });
  }
  load();
  if (window.ResizeObserver) new ResizeObserver(postHeight).observe(document.body);
  window.addEventListener("load", postHeight);
</script>
</body>
</html>`;
