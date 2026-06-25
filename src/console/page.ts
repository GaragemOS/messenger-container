// Pagina do console interno (HTML servido pela central). Frontend sem comentarios
// por convencao; app shell estilo SaaS, gestao por produto e builder visual de flows.
export const CONSOLE_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Garagem · Console</title>
<style>
  :root {
    --bg: #F6F7F9; --panel: #fff; --border: #E6E8EC; --text: #14161A;
    --muted: #6B7280; --primary: #4F46E5; --primary-weak: #EEF0FF;
    --danger: #DC2626; --ok: #16A34A; --r: 10px;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 14px; }
  .hidden { display: none !important; }
  .muted { color: var(--muted); }
  button { font: inherit; cursor: pointer; border: 0; }
  input, select, textarea { font: inherit; }
  a { color: var(--primary); }

  .btn { background: var(--primary); color: #fff; border-radius: 8px; padding: 9px 16px; font-weight: 600; font-size: 13px; }
  .btn:hover { filter: brightness(1.07); }
  .btn:disabled { opacity: .5; cursor: default; }
  .btn.ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .btn.ghost:hover { background: var(--bg); filter: none; }
  .btn.danger { background: transparent; color: var(--danger); border: 1px solid transparent; padding: 6px 10px; font-size: 12px; }
  .btn.danger:hover { background: #FEF2F2; }
  .btn.sm { padding: 7px 12px; font-size: 12px; }
  .icon-btn { width: 28px; height: 28px; border-radius: 8px; background: var(--primary-weak); color: var(--primary); font-size: 18px; line-height: 1; display: grid; place-items: center; }

  label { display: block; font-size: 12px; color: var(--muted); margin: 0 0 6px; font-weight: 500; }
  .in { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--panel); color: var(--text); outline: none; }
  .in:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-weak); }
  textarea.in { min-height: 80px; resize: vertical; }
  .field { margin-bottom: 14px; }

  .auth { min-height: 100%; display: grid; place-items: center; padding: 24px; }
  .auth-card { width: min(92vw, 400px); background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 32px; box-shadow: 0 8px 30px rgba(0,0,0,.06); }
  .brand { font-weight: 800; letter-spacing: -.2px; color: var(--primary); }
  .auth-card h1 { font-size: 20px; margin: 14px 0 4px; }
  .auth-card .sub { color: var(--muted); margin: 0 0 20px; }
  .auth-card .btn { width: 100%; padding: 12px; margin-top: 8px; }
  .link { background: none; color: var(--primary); padding: 10px 0 0; font-size: 13px; display: block; margin: 0 auto; }
  .msg { font-size: 13px; margin-top: 12px; min-height: 18px; }
  .msg.error { color: var(--danger); } .msg.ok { color: var(--ok); }

  .app { height: 100%; display: grid; grid-template-columns: 260px 1fr; }
  .sidebar { background: var(--panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 18px 14px; }
  .sidebar .logo { font-weight: 800; color: var(--primary); font-size: 18px; padding: 4px 8px 18px; }
  .side-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
  .side-list { margin-top: 6px; overflow-y: auto; flex: 1; }
  .side-item { padding: 9px 10px; border-radius: 8px; cursor: pointer; font-weight: 500; }
  .side-item:hover { background: var(--bg); }
  .side-item.active { background: var(--primary-weak); color: var(--primary); }
  .side-item .s2 { font-size: 12px; color: var(--muted); font-weight: 400; }
  .side-item.active .s2 { color: var(--primary); opacity: .8; }
  .side-foot { border-top: 1px solid var(--border); padding-top: 14px; margin-top: 10px; }
  .side-foot .ue { font-size: 12px; color: var(--muted); padding: 0 8px 8px; word-break: break-all; }

  .main { display: flex; flex-direction: column; overflow: hidden; }
  .topbar { border-bottom: 1px solid var(--border); padding: 16px 28px 0; background: var(--panel); }
  .topbar h2 { margin: 0; font-size: 18px; }
  .topbar .tsub { color: var(--muted); font-size: 13px; margin: 2px 0 12px; }
  .tabs { display: flex; gap: 4px; }
  .tab { background: none; color: var(--muted); padding: 10px 12px; font-size: 13px; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--primary); border-bottom-color: var(--primary); }
  .content { padding: 24px 28px; overflow-y: auto; flex: 1; }

  .card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--r); padding: 18px; margin-bottom: 16px; }
  .card h3 { margin: 0 0 14px; font-size: 14px; }
  .row-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .row-head h3 { margin: 0; }
  .list-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .list-row:last-child { border-bottom: 0; }
  .list-row .l1 { font-weight: 500; } .list-row .l2 { font-size: 12px; color: var(--muted); }
  .badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; background: var(--bg); color: var(--muted); border: 1px solid var(--border); }
  .badge.green { background: #ECFDF3; color: #067647; border-color: #ABEFC6; }
  .badge.red { background: #FEF3F2; color: #B42318; border-color: #FECDCA; }
  .empty { text-align: center; color: var(--muted); padding: 40px 20px; }
  code { background: var(--bg); padding: 2px 6px; border-radius: 6px; font-size: 12px; }
  .reveal { background: #0B1220; color: #BFE3C6; padding: 14px; border-radius: 10px; font-family: ui-monospace, monospace; font-size: 12px; word-break: break-all; margin-top: 12px; }
  .reveal .warn { color: #FBBF77; display: block; margin-bottom: 6px; font-family: inherit; font-weight: 600; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .inline-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end; }
  .screen-frame { width: 100%; border: 0; min-height: 280px; border-radius: 10px; background: var(--panel); }

  .modal { position: fixed; inset: 0; background: rgba(15,18,25,.45); display: grid; place-items: center; padding: 20px; z-index: 50; }
  .modal-card { width: min(92vw, 440px); background: var(--panel); border-radius: 16px; padding: 24px; }
  .modal-card h3 { margin: 0 0 16px; font-size: 16px; }

  /* Flow builder */
  .builder-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .builder-top .in { max-width: 320px; }
  .builder { display: grid; grid-template-columns: 1fr 340px; gap: 16px; align-items: start; }
  @media (max-width: 920px) { .builder { grid-template-columns: 1fr; } }
  .screens-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .scr-tab { padding: 6px 12px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border); font-size: 12px; font-weight: 600; color: var(--muted); }
  .scr-tab.active { background: var(--primary-weak); color: var(--primary); border-color: var(--primary-weak); }
  .comp { border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 10px; background: var(--panel); }
  .comp-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .comp-head .ct { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--muted); }
  .comp-head .cc { display: flex; gap: 2px; }
  .mini { width: 26px; height: 26px; border-radius: 6px; background: var(--bg); color: var(--muted); font-size: 13px; display: grid; place-items: center; }
  .mini:hover { background: var(--primary-weak); color: var(--primary); }
  .add-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
  .add-bar .btn { background: var(--primary-weak); color: var(--primary); }
  .phone { border: 8px solid #11141A; border-radius: 28px; background: #fff; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.12); position: sticky; top: 0; }
  .phone-head { background: #075E54; color: #fff; padding: 14px 16px; font-weight: 600; font-size: 14px; }
  .phone-body { padding: 16px; min-height: 260px; display: flex; flex-direction: column; gap: 12px; background: #ECE5DD; }
  .pv-heading { font-size: 17px; font-weight: 700; }
  .pv-text { font-size: 13px; color: #444; }
  .pv-field label { margin-bottom: 4px; }
  .pv-box { background: #fff; border: 1px solid #cfcfcf; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #888; }
  .pv-btn { background: #075E54; color: #fff; text-align: center; padding: 11px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: auto; }
</style>
</head>
<body>

<div class="auth" id="auth">
  <div class="auth-card">
    <div class="brand">GARAGEM</div>
    <section id="v-login">
      <h1>Entrar no console</h1>
      <p class="sub">Acesso restrito a e-mails @garagem.dev.br.</p>
      <div class="field"><label>E-mail</label><input class="in" id="li-email" type="email" placeholder="voce@garagem.dev.br" /></div>
      <div class="field"><label>Senha</label><input class="in" id="li-pass" type="password" autocomplete="current-password" /></div>
      <button class="btn" id="b-login">Entrar</button>
      <button class="link" id="go-request">Primeiro acesso? Definir senha</button>
      <div class="msg" id="li-msg"></div>
    </section>
    <section id="v-request" class="hidden">
      <h1>Primeiro acesso</h1>
      <p class="sub">Enviaremos um código para o seu e-mail.</p>
      <div class="field"><label>E-mail</label><input class="in" id="rq-email" type="email" placeholder="voce@garagem.dev.br" /></div>
      <button class="btn" id="b-request">Enviar código</button>
      <button class="link" id="go-login-1">Já tenho senha</button>
      <div class="msg" id="rq-msg"></div>
    </section>
    <section id="v-setpass" class="hidden">
      <h1>Definir senha</h1>
      <p class="sub">Informe o código e crie sua senha (mín. 10 caracteres).</p>
      <div class="field"><label>Código</label><input class="in" id="sp-code" inputmode="numeric" placeholder="000000" /></div>
      <div class="field"><label>Nova senha</label><input class="in" id="sp-pass" type="password" autocomplete="new-password" /></div>
      <button class="btn" id="b-setpass">Definir senha</button>
      <button class="link" id="go-login-2">Voltar</button>
      <div class="msg" id="sp-msg"></div>
    </section>
  </div>
</div>

<div class="app hidden" id="app">
  <aside class="sidebar">
    <div class="logo">Garagem</div>
    <div class="side-head"><span>Produtos</span><button class="icon-btn" id="b-new-product" title="Novo produto">+</button></div>
    <div class="side-list" id="product-list"></div>
    <div class="side-foot">
      <div class="ue" id="user-email"></div>
      <button class="btn ghost sm" id="b-logout" style="width:100%">Sair</button>
    </div>
  </aside>
  <main class="main">
    <div class="topbar" id="topbar"></div>
    <div class="content" id="content"><div class="empty">Selecione ou crie um produto para começar.</div></div>
  </main>
</div>

<div class="modal hidden" id="np-modal">
  <div class="modal-card">
    <h3>Novo produto</h3>
    <div class="field"><label>Nome</label><input class="in" id="np-name" placeholder="App de Psicólogos" /></div>
    <div class="field"><label>Slug</label><input class="in" id="np-slug" placeholder="app-psicologos" /></div>
    <div class="field"><label>Origens permitidas (vírgula)</label><input class="in" id="np-origins" placeholder="https://app.garagem.dev" /></div>
    <div class="inline-actions" style="justify-content:flex-end">
      <button class="btn ghost" id="np-cancel">Cancelar</button>
      <button class="btn" id="np-create">Criar produto</button>
    </div>
    <div class="msg" id="np-msg"></div>
  </div>
</div>

<script>
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  function msg(id, t, k) { var e = $(id); e.textContent = t || ""; e.className = "msg" + (k ? " " + k : ""); }
  async function api(p, b) { var r = await fetch(p, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(b || {}) }); var d = {}; try { d = await r.json(); } catch (e) {} return { ok: r.ok, status: r.status, data: d }; }
  async function apiGet(p) { var r = await fetch(p, { credentials: "same-origin" }); var d = {}; try { d = await r.json(); } catch (e) {} return { ok: r.ok, status: r.status, data: d }; }

  var setEmail = "", selected = null, curTab = "keys";

  function showAuth(v) { $("app").classList.add("hidden"); $("auth").classList.remove("hidden"); ["login", "request", "setpass"].forEach(function (x) { $("v-" + x).classList.toggle("hidden", x !== v); }); }
  function showApp() { $("auth").classList.add("hidden"); $("app").classList.remove("hidden"); loadProducts(); }

  $("go-request").onclick = function () { showAuth("request"); };
  $("go-login-1").onclick = function () { showAuth("login"); };
  $("go-login-2").onclick = function () { showAuth("login"); };
  $("b-request").onclick = async function () { var e = $("rq-email").value.trim(); $("b-request").disabled = true; msg("rq-msg", "Enviando...", ""); await api("/auth/request-code", { email: e }); $("b-request").disabled = false; setEmail = e; msg("sp-msg", "Se o e-mail for válido, o código foi enviado.", "ok"); showAuth("setpass"); };
  $("b-setpass").onclick = async function () { var r = await api("/auth/set-password", { email: setEmail, code: $("sp-code").value.trim(), password: $("sp-pass").value }); if (r.ok) { msg("li-msg", "Senha definida. Faça login.", "ok"); showAuth("login"); $("li-email").value = setEmail; } else { msg("sp-msg", (r.data && r.data.error) || "Erro.", "error"); } };
  $("b-login").onclick = async function () { var e = $("li-email").value.trim(); $("b-login").disabled = true; msg("li-msg", "Entrando...", ""); var r = await api("/auth/login", { email: e, password: $("li-pass").value }); $("b-login").disabled = false; if (r.ok) { $("user-email").textContent = (r.data && r.data.email) || e; showApp(); } else { msg("li-msg", (r.data && r.data.error) || "Credenciais inválidas.", "error"); } };
  $("b-logout").onclick = async function () { await api("/auth/logout", {}); selected = null; showAuth("login"); };

  $("b-new-product").onclick = function () { $("np-modal").classList.remove("hidden"); };
  $("np-cancel").onclick = function () { $("np-modal").classList.add("hidden"); };
  $("np-create").onclick = async function () {
    var origins = $("np-origins").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var r = await api("/api/products", { name: $("np-name").value.trim(), slug: $("np-slug").value.trim(), allowed_origins: origins });
    if (r.ok) { $("np-name").value = ""; $("np-slug").value = ""; $("np-origins").value = ""; $("np-modal").classList.add("hidden"); selected = r.data.id; loadProducts(); }
    else { msg("np-msg", (r.data && r.data.error) || "Erro ao criar.", "error"); }
  };

  async function loadProducts() {
    var r = await apiGet("/api/products");
    var list = $("product-list"); list.textContent = "";
    var products = (r.data && r.data.products) || [];
    if (!products.length) { list.appendChild(el("div", "empty", "Nenhum produto.")); $("content").innerHTML = ""; $("content").appendChild(el("div", "empty", "Crie seu primeiro produto no +.")); $("topbar").textContent = ""; return; }
    products.forEach(function (p) {
      var it = el("div", "side-item" + (selected === p.id ? " active" : ""));
      it.appendChild(el("div", null, p.name));
      it.appendChild(el("div", "s2", p.slug));
      it.onclick = function () { selected = p.id; curTab = "keys"; loadProducts(); openProduct(p); };
      list.appendChild(it);
    });
    var cur = products.filter(function (p) { return p.id === selected; })[0] || null;
    if (cur) openProduct(cur); else { $("topbar").textContent = ""; $("content").innerHTML = ""; $("content").appendChild(el("div", "empty", "Selecione um produto.")); }
  }

  function openProduct(p) {
    var tb = $("topbar"); tb.textContent = "";
    tb.appendChild(el("h2", null, p.name));
    tb.appendChild(el("div", "tsub", p.slug + (p.allowed_origins && p.allowed_origins.length ? " · " + p.allowed_origins.join(", ") : "")));
    var tabs = el("div", "tabs");
    [["keys", "Chaves de API"], ["multitenant", "Multitenant"], ["templates", "Templates"], ["flows", "Flows"], ["metrics", "Métricas"]].forEach(function (t) {
      var b = el("button", "tab" + (curTab === t[0] ? " active" : ""), t[1]);
      b.onclick = function () { curTab = t[0]; openProduct(p); };
      tabs.appendChild(b);
    });
    tb.appendChild(tabs);
    var c = $("content"); c.textContent = "";
    if (curTab === "keys") return renderKeys(p, c);
    if (curTab === "multitenant") return loadMultitenant(p, c);
    if (curTab === "templates") return loadTemplates(p, c);
    if (curTab === "flows") return loadFlows(p, c);
    renderMetrics(p, c);
  }

  function renderMetrics(p, c) {
    c.appendChild(el("div", "empty", "Carregando métricas..."));
    api("/api/products/" + p.id + "/embed-token", { class: "metrics" }).then(function (r) {
      c.textContent = "";
      if (!r.ok || !r.data.embed_token) { c.appendChild(el("div", "empty", "Não foi possível carregar.")); return; }
      var card = el("div", "card");
      var f = document.createElement("iframe"); f.className = "screen-frame"; f.src = "/v1/screen/metrics?t=" + encodeURIComponent(r.data.embed_token);
      card.appendChild(f); c.appendChild(card);
    });
  }

  function renderKeys(p, c) {
    var card = el("div", "card");
    var head = el("div", "row-head"); head.appendChild(el("h3", null, "Chaves de API"));
    var gen = el("button", "btn sm", "Gerar nova chave"); head.appendChild(gen); card.appendChild(head);
    var box = el("div"); card.appendChild(box);
    var reveal = el("div"); card.appendChild(reveal);
    c.appendChild(card);
    gen.onclick = async function () {
      var r = await api("/api/products/" + p.id + "/keys", {});
      if (r.ok && r.data.key) { reveal.textContent = ""; var rv = el("div", "reveal"); rv.appendChild(el("span", "warn", "Copie agora — não será exibida novamente.")); rv.appendChild(document.createTextNode(r.data.key)); reveal.appendChild(rv); loadKeys(); }
    };
    async function loadKeys() {
      var r = await apiGet("/api/products/" + p.id + "/keys"); box.textContent = "";
      var keys = (r.data && r.data.keys) || [];
      if (!keys.length) { box.appendChild(el("div", "empty", "Nenhuma chave gerada.")); return; }
      keys.forEach(function (k) {
        var row = el("div", "list-row");
        var left = el("div"); left.appendChild(el("code", null, k.key_id + "…" + k.last_four)); row.appendChild(left);
        var right = el("div", "inline-actions"); right.appendChild(el("span", "badge" + (k.status === "active" ? " green" : " red"), k.status));
        if (k.status === "active") { var rev = el("button", "btn danger", "revogar"); rev.onclick = async function () { await api("/api/keys/" + k.id + "/revoke", {}); loadKeys(); }; right.appendChild(rev); }
        row.appendChild(right); box.appendChild(row);
      });
    }
    loadKeys();
  }

  function inp(ph, val) { var i = el("input", "in"); i.placeholder = ph || ""; if (val) i.value = val; return i; }
  function selOf(items, vf, lf) { var s = el("select", "in"); items.forEach(function (it) { var o = document.createElement("option"); o.value = vf(it); o.textContent = lf(it); s.appendChild(o); }); return s; }

  async function loadMultitenant(p, c) {
    var r = await apiGet("/api/products/" + p.id + "/tenants");
    var companies = (r.data && r.data.companies) || [], wabas = (r.data && r.data.wabas) || [], numbers = (r.data && r.data.numbers) || [];
    var form = el("div", "card"); form.appendChild(el("h3", null, "Nova empresa cliente"));
    var nm = inp("Nome da empresa"), ext = inp("Referência externa (opcional)");
    var g = el("div", "grid2"); g.appendChild(nm); g.appendChild(ext); form.appendChild(g);
    var add = el("button", "btn sm", "Adicionar empresa"); add.style.marginTop = "12px";
    add.onclick = async function () { if (!nm.value.trim()) return; await api("/api/products/" + p.id + "/tenants", { name: nm.value.trim(), external_ref: ext.value.trim() || null }); loadMultitenant(p, c); };
    form.appendChild(add); c.textContent = ""; c.appendChild(form);

    if (!companies.length) { c.appendChild(el("div", "empty", "Nenhuma empresa cadastrada ainda.")); return; }
    companies.forEach(function (co) {
      var card = el("div", "card");
      card.appendChild(el("h3", null, co.name + (co.external_ref ? "  ·  " + co.external_ref : "")));
      var cw = wabas.filter(function (w) { return w.company_id === co.id; });
      cw.forEach(function (w) {
        card.appendChild(el("div", "l2", "WABA " + w.waba_id_meta));
        var pn = inp("Phone Number ID (Meta)"), dn = inp("Nome de exibição"), dp = inp("Telefone");
        var bar = el("div", "inline-actions"); [pn, dn, dp].forEach(function (x) { bar.appendChild(x); });
        var b = el("button", "btn sm ghost", "+ número"); bar.appendChild(b);
        b.onclick = async function () { if (!pn.value.trim()) return; await api("/api/products/" + p.id + "/wabas/" + w.id + "/numbers", { phone_number_id_meta: pn.value.trim(), display_name: dn.value.trim() || null, display_phone: dp.value.trim() || null }); loadMultitenant(p, c); };
        bar.style.margin = "6px 0 12px"; card.appendChild(bar);
      });
      var wid = inp("ID da WABA (Meta)"), wn = inp("Nome (opcional)");
      var wbar = el("div", "inline-actions"); wbar.appendChild(wid); wbar.appendChild(wn);
      var wb = el("button", "btn sm ghost", "+ WABA"); wbar.appendChild(wb);
      wb.onclick = async function () { if (!wid.value.trim()) return; await api("/api/products/" + p.id + "/tenants/" + co.id + "/wabas", { waba_id_meta: wid.value.trim(), name: wn.value.trim() || null }); loadMultitenant(p, c); };
      card.appendChild(wbar);
      var cn = numbers.filter(function (n) { return n.company_id === co.id; });
      cn.forEach(function (n) { var row = el("div", "list-row"); var left = el("div"); left.appendChild(el("div", "l1", n.display_name || n.phone_number_id_meta)); if (n.display_phone) left.appendChild(el("div", "l2", n.display_phone)); row.appendChild(left); row.appendChild(el("span", "badge", n.quality_rating)); card.appendChild(row); });
      c.appendChild(card);
    });
  }

  async function loadTemplates(p, c) {
    var tr = await apiGet("/api/products/" + p.id + "/tenants");
    var wabas = (tr.data && tr.data.wabas) || [];
    var form = el("div", "card"); form.appendChild(el("h3", null, "Novo template"));
    if (!wabas.length) { form.appendChild(el("div", "empty", "Cadastre uma WABA na aba Multitenant primeiro.")); }
    else {
      var ws = selOf(wabas, function (w) { return w.id; }, function (w) { return w.company_name + " · " + w.waba_id_meta; });
      var nm = inp("nome_do_template"), lg = inp("Idioma", "pt_BR"), ct = selOf(["utility", "marketing", "authentication"], function (v) { return v; }, function (v) { return v; });
      var bt = el("textarea", "in"); bt.placeholder = "Corpo da mensagem (use {{1}} para variáveis)";
      var f1 = el("div", "field"); f1.appendChild(el("label", null, "Empresa / WABA")); f1.appendChild(ws); form.appendChild(f1);
      var g = el("div", "grid2"); var f2 = el("div", "field"); f2.appendChild(el("label", null, "Nome")); f2.appendChild(nm); var f3 = el("div", "field"); f3.appendChild(el("label", null, "Idioma")); f3.appendChild(lg); g.appendChild(f2); g.appendChild(f3); form.appendChild(g);
      var f4 = el("div", "field"); f4.appendChild(el("label", null, "Categoria")); f4.appendChild(ct); form.appendChild(f4);
      var f5 = el("div", "field"); f5.appendChild(el("label", null, "Corpo")); f5.appendChild(bt); form.appendChild(f5);
      var m = el("div", "msg"); var b = el("button", "btn sm", "Criar template");
      b.onclick = async function () { var r = await api("/api/products/" + p.id + "/templates", { waba_id: ws.value, name: nm.value.trim(), language: lg.value.trim() || "pt_BR", category: ct.value, components: { body: { text: bt.value } } }); if (r.ok) loadTemplates(p, c); else { m.textContent = (r.data.detalhes && r.data.detalhes.join("; ")) || r.data.error || "erro"; m.className = "msg error"; } };
      form.appendChild(b); form.appendChild(m);
    }
    c.textContent = ""; c.appendChild(form);
    var lr = await apiGet("/api/products/" + p.id + "/templates");
    var templates = (lr.data && lr.data.templates) || [];
    var listCard = el("div", "card"); listCard.appendChild(el("h3", null, "Templates (" + templates.length + ")"));
    if (!templates.length) listCard.appendChild(el("div", "empty", "Nenhum template."));
    templates.forEach(function (t) { var row = el("div", "list-row"); var left = el("div"); left.appendChild(el("div", "l1", t.name)); left.appendChild(el("div", "l2", t.language + " · " + t.category)); row.appendChild(left); row.appendChild(el("span", "badge", t.status)); listCard.appendChild(row); });
    c.appendChild(listCard);
  }

  /* ---- Flows: lista + builder visual ---- */
  async function loadFlows(p, c) {
    c.textContent = "";
    var head = el("div", "row-head"); head.appendChild(el("h3", null, "Flows")); var nb = el("button", "btn sm", "+ Novo flow"); head.appendChild(nb);
    var wrap = el("div", "card"); wrap.appendChild(head);
    var lr = await apiGet("/api/products/" + p.id + "/flows");
    var flows = (lr.data && lr.data.flows) || [];
    if (!flows.length) wrap.appendChild(el("div", "empty", "Nenhum flow. Crie um no construtor visual."));
    flows.forEach(function (f) {
      var row = el("div", "list-row"); var left = el("div"); left.appendChild(el("div", "l1", f.name)); row.appendChild(left);
      var right = el("div", "inline-actions"); right.appendChild(el("span", "badge", f.status)); var ed = el("button", "btn sm ghost", "Editar"); right.appendChild(ed); row.appendChild(right);
      ed.onclick = async function () { var d = await apiGet("/api/products/" + p.id + "/flows/" + f.id); openBuilder(p, c, { id: f.id, name: f.name, model: normalizeModel(d.data && d.data.flow_json) }); };
      wrap.appendChild(row);
    });
    c.appendChild(wrap);
    nb.onclick = function () { openBuilder(p, c, null); };
  }

  function normalizeModel(j) {
    if (j && j.screens && j.screens.length) return j;
    return { version: 1, screens: [{ id: "TELA_1", title: "Tela 1", components: [] }] };
  }

  function openBuilder(p, c, existing) {
    var flow = existing || { id: null, name: "", model: normalizeModel(null) };
    var st = { name: flow.name, model: flow.model, scr: 0 };
    c.textContent = "";

    var top = el("div", "builder-top");
    var nameIn = inp("Nome do flow"); nameIn.value = st.name; nameIn.oninput = function () { st.name = nameIn.value; };
    top.appendChild(nameIn);
    var acts = el("div", "inline-actions");
    var back = el("button", "btn ghost", "Voltar"); back.onclick = function () { loadFlows(p, c); };
    var save = el("button", "btn", "Salvar flow");
    acts.appendChild(back); acts.appendChild(save); top.appendChild(acts);
    c.appendChild(top);
    var smsg = el("div", "msg"); c.appendChild(smsg);

    var builder = el("div", "builder");
    var editor = el("div", "card"); var preview = el("div"); builder.appendChild(editor); builder.appendChild(preview);
    c.appendChild(builder);

    function screen() { return st.model.screens[st.scr]; }

    function renderPreview() {
      preview.textContent = "";
      var phone = el("div", "phone");
      phone.appendChild(el("div", "phone-head", screen().title || "Tela"));
      var pb = el("div", "phone-body");
      screen().components.forEach(function (cp) {
        if (cp.type === "heading") pb.appendChild(el("div", "pv-heading", cp.text || "Título"));
        else if (cp.type === "text") pb.appendChild(el("div", "pv-text", cp.text || "Texto..."));
        else if (cp.type === "input") { var w = el("div", "pv-field"); w.appendChild(el("label", null, cp.label || "Campo")); w.appendChild(el("div", "pv-box", "Digite...")); pb.appendChild(w); }
        else if (cp.type === "dropdown") { var w2 = el("div", "pv-field"); w2.appendChild(el("label", null, cp.label || "Seleção")); w2.appendChild(el("div", "pv-box", (cp.options && cp.options[0]) || "Selecione" + "  ▾")); pb.appendChild(w2); }
        else if (cp.type === "button") pb.appendChild(el("div", "pv-btn", cp.label || "Botão"));
      });
      phone.appendChild(pb); preview.appendChild(phone);
    }

    function compEditor(cp, idx) {
      var box = el("div", "comp");
      var h = el("div", "comp-head");
      var labels = { heading: "Título", text: "Texto", input: "Campo", dropdown: "Lista", button: "Botão" };
      h.appendChild(el("span", "ct", labels[cp.type] || cp.type));
      var cc = el("div", "cc");
      var up = el("button", "mini", "↑"), dn = el("button", "mini", "↓"), rm = el("button", "mini", "✕");
      up.onclick = function () { if (idx > 0) { var a = screen().components; var t = a[idx - 1]; a[idx - 1] = a[idx]; a[idx] = t; renderEditor(); } };
      dn.onclick = function () { var a = screen().components; if (idx < a.length - 1) { var t = a[idx + 1]; a[idx + 1] = a[idx]; a[idx] = t; renderEditor(); } };
      rm.onclick = function () { screen().components.splice(idx, 1); renderEditor(); };
      cc.appendChild(up); cc.appendChild(dn); cc.appendChild(rm); h.appendChild(cc); box.appendChild(h);

      if (cp.type === "heading" || cp.type === "text" || cp.type === "button") {
        var key = cp.type === "button" ? "label" : "text";
        var i = inp(cp.type === "button" ? "Texto do botão" : "Texto"); i.value = cp[key] || "";
        i.oninput = function () { cp[key] = i.value; renderPreview(); }; box.appendChild(i);
      } else if (cp.type === "input") {
        var g = el("div", "grid2"); var l = inp("Rótulo"); l.value = cp.label || ""; var nm = inp("name (campo)"); nm.value = cp.name || "";
        l.oninput = function () { cp.label = l.value; renderPreview(); }; nm.oninput = function () { cp.name = nm.value; };
        g.appendChild(l); g.appendChild(nm); box.appendChild(g);
      } else if (cp.type === "dropdown") {
        var g2 = el("div", "grid2"); var l2 = inp("Rótulo"); l2.value = cp.label || ""; var n2 = inp("name (campo)"); n2.value = cp.name || "";
        l2.oninput = function () { cp.label = l2.value; renderPreview(); }; n2.oninput = function () { cp.name = n2.value; };
        g2.appendChild(l2); g2.appendChild(n2); box.appendChild(g2);
        var op = inp("Opções (separadas por vírgula)"); op.value = (cp.options || []).join(", "); op.style.marginTop = "8px";
        op.oninput = function () { cp.options = op.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); renderPreview(); }; box.appendChild(op);
      }
      return box;
    }

    function renderEditor() {
      editor.textContent = "";
      var sb = el("div", "screens-bar");
      st.model.screens.forEach(function (s, i) {
        var t = el("button", "scr-tab" + (i === st.scr ? " active" : ""), s.title || ("Tela " + (i + 1)));
        t.onclick = function () { st.scr = i; renderEditor(); }; sb.appendChild(t);
      });
      var addScr = el("button", "scr-tab", "+ Tela");
      addScr.onclick = function () { st.model.screens.push({ id: "TELA_" + (st.model.screens.length + 1), title: "Tela " + (st.model.screens.length + 1), components: [] }); st.scr = st.model.screens.length - 1; renderEditor(); };
      sb.appendChild(addScr); editor.appendChild(sb);

      var tf = el("div", "field"); tf.appendChild(el("label", null, "Título da tela"));
      var ti = inp("Título"); ti.value = screen().title || ""; ti.oninput = function () { screen().title = ti.value; renderPreview(); var tab = sb.children[st.scr]; if (tab) tab.textContent = ti.value || ("Tela " + (st.scr + 1)); };
      tf.appendChild(ti);
      if (st.model.screens.length > 1) { var del = el("button", "btn danger", "remover tela"); del.style.marginTop = "8px"; del.onclick = function () { st.model.screens.splice(st.scr, 1); st.scr = 0; renderEditor(); }; tf.appendChild(del); }
      editor.appendChild(tf);

      screen().components.forEach(function (cp, i) { editor.appendChild(compEditor(cp, i)); });

      var ab = el("div", "add-bar");
      [["heading", "+ Título"], ["text", "+ Texto"], ["input", "+ Campo"], ["dropdown", "+ Lista"], ["button", "+ Botão"]].forEach(function (t) {
        var b = el("button", "btn sm", t[1]);
        b.onclick = function () { var c0 = { type: t[0] }; if (t[0] === "dropdown") c0.options = []; screen().components.push(c0); renderEditor(); };
        ab.appendChild(b);
      });
      editor.appendChild(ab);
      renderPreview();
    }

    save.onclick = async function () {
      if (!st.name.trim()) { smsg.textContent = "Dê um nome ao flow."; smsg.className = "msg error"; return; }
      var path = flow.id ? "/api/products/" + p.id + "/flows/" + flow.id : "/api/products/" + p.id + "/flows";
      var r = await api(path, { name: st.name.trim(), flow_json: st.model });
      if (r.ok) { smsg.textContent = "Flow salvo."; smsg.className = "msg ok"; if (!flow.id && r.data.id) flow.id = r.data.id; }
      else { smsg.textContent = (r.data && r.data.error) || "Erro ao salvar."; smsg.className = "msg error"; }
    };

    renderEditor();
  }

  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "garagem:resize" && d.height) {
      var frames = document.getElementsByClassName("screen-frame");
      for (var i = 0; i < frames.length; i++) { if (frames[i].contentWindow === e.source) frames[i].style.height = (d.height + 8) + "px"; }
    }
  });

  (async function () { var res = await fetch("/auth/me", { credentials: "same-origin" }); if (res.ok) { var data = await res.json(); $("user-email").textContent = data.email; showApp(); } })();
</script>
</body>
</html>`;
