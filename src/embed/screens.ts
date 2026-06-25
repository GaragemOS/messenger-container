// Documento HTML servido dentro do iframe (uma das 4 telas). O conteudo e fiel
// a central e isolado por origem; nao pode ser alterado pelo app que o embute.
// Frontend sem comentarios; placeholders __TOKEN__/__CLASS__/__TITLE__/__DESC__
// sao injetados ao servir. As telas carregam dados reais escopados pelo token.

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
    --primary:#4F46E5; --surface:#FBFAFF; --surface-container:#fff; --on-surface:#1B1B21;
    --on-surface-variant:#5A5A66; --outline:#E2E1E8; --primary-container:#E5E0FF;
    --green:#1f7a3d; --yellow:#9a6700; --red:#BA1A1A;
  }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    background:var(--surface); color:var(--on-surface); }
  .wrap { padding:20px; }
  .head { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
  .badge { width:40px; height:40px; border-radius:12px; background:var(--primary-container);
    color:var(--primary); display:grid; place-items:center; font-weight:700; }
  h1 { font-size:20px; margin:0; }
  .desc { color:var(--on-surface-variant); font-size:14px; margin:2px 0 0; }
  .card { background:var(--surface-container); border:1px solid var(--outline);
    border-radius:16px; padding:16px; margin-top:14px; }
  .card h2 { font-size:13px; text-transform:uppercase; letter-spacing:.5px;
    color:var(--on-surface-variant); margin:0 0 10px; }
  .row { display:flex; justify-content:space-between; gap:12px; padding:8px 0; font-size:14px;
    border-bottom:1px solid var(--outline); align-items:center; }
  .row:last-child { border-bottom:0; }
  .row .k { color:var(--on-surface-variant); }
  .row .v { font-weight:600; word-break:break-all; text-align:right; }
  .item { display:flex; justify-content:space-between; gap:12px; padding:10px 0;
    border-bottom:1px solid var(--outline); font-size:14px; }
  .item:last-child { border-bottom:0; }
  .tag { font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px;
    background:var(--primary-container); color:var(--primary); }
  .muted { color:var(--on-surface-variant); font-size:13px; }
  .empty { color:var(--on-surface-variant); font-size:14px; padding:8px 0; }
  .err { color:var(--red); }
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

  function postHeight() { parent.postMessage({ type: "garagem:resize", height: document.body.scrollHeight }, PARENT); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function row(k, v) { var r = el("div", "row"); r.appendChild(el("span", "k", k)); r.appendChild(el("span", "v", v)); return r; }
  function api(path) { return fetch(path, { headers: { authorization: "Bearer " + TOKEN } }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }); }

  function card(title) { var c = el("div", "card"); c.appendChild(el("h2", null, title)); return c; }
  function listInto(c, items, emptyMsg, fmt) {
    if (!items || !items.length) { c.appendChild(el("p", "empty", emptyMsg)); return; }
    items.forEach(function (it) {
      var row = el("div", "item");
      var left = el("div"); left.appendChild(el("div", null, fmt.title(it))); var sub = fmt.sub(it); if (sub) left.appendChild(el("div", "muted", sub));
      row.appendChild(left); row.appendChild(el("span", "tag", fmt.tag(it)));
      c.appendChild(row);
    });
  }

  function renderContext(ctx) {
    var content = document.getElementById("content");
    var c = card("Contexto da sessao");
    c.appendChild(row("Produto", ctx.product));
    c.appendChild(row("Tela", ctx.class));
    c.appendChild(row("Sessao", ctx.session || "-"));
    content.appendChild(c);
  }

  function renderData() {
    var content = document.getElementById("content");
    if (CLASS === "templates") {
      api("/v1/embed/templates").then(function (d) {
        var c = card("Templates"); listInto(c, d.templates, "Nenhum template cadastrado ainda.",
          { title: function (t) { return t.name; }, sub: function (t) { return t.language + " · " + t.category; }, tag: function (t) { return t.status; } });
        content.appendChild(c); postHeight();
      }).catch(function () { postHeight(); });
    } else if (CLASS === "flows") {
      api("/v1/embed/flows").then(function (d) {
        var c = card("Flows"); listInto(c, d.flows, "Nenhum flow cadastrado ainda.",
          { title: function (f) { return f.name; }, sub: function () { return ""; }, tag: function (f) { return f.status; } });
        content.appendChild(c); postHeight();
      }).catch(function () { postHeight(); });
    } else if (CLASS === "multitenant") {
      api("/v1/embed/multitenant").then(function (d) {
        var c1 = card("Empresas clientes"); listInto(c1, d.companies, "Nenhuma empresa cadastrada ainda.",
          { title: function (x) { return x.name; }, sub: function () { return ""; }, tag: function (x) { return x.status; } });
        content.appendChild(c1);
        var c2 = card("Numeros"); listInto(c2, d.numbers, "Nenhum numero cadastrado ainda.",
          { title: function (n) { return n.display_name || n.phone_number_id_meta; }, sub: function (n) { return n.company_name; }, tag: function (n) { return n.quality_rating; } });
        content.appendChild(c2); postHeight();
      }).catch(function () { postHeight(); });
    } else {
      api("/v1/embed/metrics").then(function (d) {
        var c = card("Metricas"); c.appendChild(el("p", "muted", d.note || "")); content.appendChild(c); postHeight();
      }).catch(function () { postHeight(); });
    }
  }

  function fail(msg) {
    var content = document.getElementById("content"); content.textContent = "";
    content.appendChild(el("p", "err", msg)); postHeight();
  }

  function load() {
    if (!TOKEN) { fail("Token de embed ausente ou invalido."); return; }
    api("/v1/embed/context").then(function (ctx) { renderContext(ctx); renderData(); postHeight(); })
      .catch(function () { fail("Sessao invalida ou expirada. Recarregue a tela."); });
  }
  load();
  if (window.ResizeObserver) new ResizeObserver(postHeight).observe(document.body);
  window.addEventListener("load", postHeight);
</script>
</body>
</html>`;
