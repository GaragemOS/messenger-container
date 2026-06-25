// Pagina do console interno (HTML servido pela central). Frontend sem comentarios
// por convencao; app shell SaaS, gestao por produto e construtor visual de flows
// (canvas em tamanho real, edicao inline, drag com preview, e editor JSON bidirecional).
export const CONSOLE_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Garagem · Console</title>
<style>
  :root { --bg:#F6F7F9; --panel:#fff; --border:#E6E8EC; --text:#14161A; --muted:#6B7280; --primary:#4F46E5; --primary-weak:#EEF0FF; --danger:#DC2626; --ok:#16A34A; --r:10px; }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin:0; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; font-size:14px; }
  .hidden { display:none !important; }
  .muted { color:var(--muted); }
  button { font:inherit; cursor:pointer; border:0; }
  input, select, textarea { font:inherit; }
  .btn { background:var(--primary); color:#fff; border-radius:8px; padding:9px 16px; font-weight:600; font-size:13px; }
  .btn:hover { filter:brightness(1.07); } .btn:disabled { opacity:.5; cursor:default; }
  .btn.ghost { background:transparent; color:var(--text); border:1px solid var(--border); }
  .btn.ghost:hover { background:var(--bg); filter:none; }
  .btn.danger { background:transparent; color:var(--danger); border:1px solid transparent; padding:6px 10px; font-size:12px; }
  .btn.danger:hover { background:#FEF2F2; }
  .btn.sm { padding:7px 12px; font-size:12px; }
  .icon-btn { width:28px; height:28px; border-radius:8px; background:var(--primary-weak); color:var(--primary); font-size:18px; line-height:1; display:grid; place-items:center; }
  label { display:block; font-size:12px; color:var(--muted); margin:0 0 6px; font-weight:500; }
  .in { width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; background:var(--panel); color:var(--text); outline:none; }
  .in:focus { border-color:var(--primary); box-shadow:0 0 0 3px var(--primary-weak); }
  textarea.in { min-height:70px; resize:vertical; }
  .field { margin-bottom:14px; }
  .auth { min-height:100%; display:grid; place-items:center; padding:24px; }
  .auth-card { width:min(92vw,400px); background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:32px; box-shadow:0 8px 30px rgba(0,0,0,.06); }
  .brand { font-weight:800; letter-spacing:-.2px; color:var(--primary); }
  .auth-card h1 { font-size:20px; margin:14px 0 4px; } .auth-card .sub { color:var(--muted); margin:0 0 20px; } .auth-card .btn { width:100%; padding:12px; margin-top:8px; }
  .link { background:none; color:var(--primary); padding:10px 0 0; font-size:13px; display:block; margin:0 auto; }
  .msg { font-size:13px; margin-top:12px; min-height:18px; } .msg.error { color:var(--danger); } .msg.ok { color:var(--ok); }
  .app { height:100%; display:grid; grid-template-columns:220px 1fr; }
  .app.collapsed { grid-template-columns:0 1fr; }
  .app.collapsed .sidebar { display:none; }
  .app.collapsed .topbar { padding-left:54px; }
  .expand-btn { position:fixed; top:14px; left:10px; z-index:40; width:34px; height:34px; border-radius:8px; background:var(--panel); border:1px solid var(--border); color:var(--primary); font-size:16px; }
  .logo-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .collapse-btn { background:none; color:var(--muted); font-size:18px; line-height:1; padding:4px 8px; border-radius:6px; }
  .collapse-btn:hover { background:var(--bg); color:var(--text); }
  .sidebar { background:var(--panel); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:18px 14px; }
  .sidebar .logo { font-weight:800; color:var(--primary); font-size:18px; padding:4px 8px; }
  .side-head { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.4px; }
  .side-list { margin-top:6px; overflow-y:auto; flex:1; }
  .side-item { padding:9px 10px; border-radius:8px; cursor:pointer; font-weight:500; }
  .side-item:hover { background:var(--bg); } .side-item.active { background:var(--primary-weak); color:var(--primary); }
  .side-item .s2 { font-size:12px; color:var(--muted); font-weight:400; } .side-item.active .s2 { color:var(--primary); opacity:.8; }
  .side-foot { border-top:1px solid var(--border); padding-top:14px; margin-top:10px; } .side-foot .ue { font-size:12px; color:var(--muted); padding:0 8px 8px; word-break:break-all; }
  .main { display:flex; flex-direction:column; overflow:hidden; }
  .topbar { border-bottom:1px solid var(--border); padding:16px 28px 0; background:var(--panel); }
  .topbar h2 { margin:0; font-size:18px; } .topbar .tsub { color:var(--muted); font-size:13px; margin:2px 0 12px; }
  .tabs { display:flex; gap:4px; }
  .tab { background:none; color:var(--muted); padding:10px 12px; font-size:13px; font-weight:600; border-bottom:2px solid transparent; margin-bottom:-1px; }
  .tab:hover { color:var(--text); } .tab.active { color:var(--primary); border-bottom-color:var(--primary); }
  .content { padding:24px 28px; overflow-y:auto; flex:1; }
  .card { background:var(--panel); border:1px solid var(--border); border-radius:var(--r); padding:18px; margin-bottom:16px; }
  .card h3 { margin:0 0 14px; font-size:14px; }
  .row-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; } .row-head h3 { margin:0; }
  .list-row { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 0; border-bottom:1px solid var(--border); } .list-row:last-child { border-bottom:0; }
  .list-row .l1 { font-weight:500; } .list-row .l2 { font-size:12px; color:var(--muted); }
  .badge { font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; background:var(--bg); color:var(--muted); border:1px solid var(--border); }
  .badge.green { background:#ECFDF3; color:#067647; border-color:#ABEFC6; } .badge.red { background:#FEF3F2; color:#B42318; border-color:#FECDCA; }
  .empty { text-align:center; color:var(--muted); padding:40px 20px; }
  code { background:var(--bg); padding:2px 6px; border-radius:6px; font-size:12px; }
  .reveal { background:#0B1220; color:#BFE3C6; padding:14px; border-radius:10px; font-family:ui-monospace,monospace; font-size:12px; word-break:break-all; margin-top:12px; }
  .reveal .warn { color:#FBBF77; display:block; margin-bottom:6px; font-family:inherit; font-weight:600; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .inline-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end; }
  .screen-frame { width:100%; border:0; min-height:280px; border-radius:10px; background:var(--panel); }
  .modal { position:fixed; inset:0; background:rgba(15,18,25,.45); display:grid; place-items:center; padding:20px; z-index:50; }
  .modal-card { width:min(92vw,440px); background:var(--panel); border-radius:16px; padding:24px; } .modal-card h3 { margin:0 0 16px; font-size:16px; }

  .fb-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; } .fb-top .in { max-width:320px; }
  .fb { display:grid; grid-template-columns:190px minmax(0,1fr) 300px; gap:14px; align-items:start; }
  @media (max-width:1100px){ .fb { grid-template-columns:1fr; } }
  .fb-pane { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:14px; }
  .fb-pane h4 { margin:0 0 10px; font-size:12px; text-transform:uppercase; letter-spacing:.4px; color:var(--muted); }
  .pal { display:flex; flex-direction:column; gap:6px; }
  .pal button { text-align:left; background:var(--bg); border:1px solid var(--border); color:var(--text); padding:8px 10px; border-radius:8px; font-size:13px; }
  .pal button:hover { background:var(--primary-weak); border-color:var(--primary-weak); color:var(--primary); }
  .scrs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
  .scrs .s { padding:6px 10px; border-radius:8px; background:var(--bg); border:1px solid var(--border); font-size:12px; font-weight:600; color:var(--muted); cursor:pointer; }
  .scrs .s.active { background:var(--primary-weak); color:var(--primary); border-color:var(--primary-weak); }
  .var { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:6px 0; border-bottom:1px solid var(--border); font-size:12px; } .var:last-child { border-bottom:0; }
  .chip { background:var(--primary-weak); color:var(--primary); border-radius:6px; padding:3px 7px; font-size:11px; font-family:ui-monospace,monospace; cursor:pointer; border:0; }
  .stage { display:flex; justify-content:center; }
  .sheet { width:360px; height:640px; background:#fff; border-radius:22px 22px 12px 12px; overflow:hidden; border:1px solid var(--border); box-shadow:0 14px 44px rgba(0,0,0,.14); display:flex; flex-direction:column; }
  .sheet-head { background:#fff; border-bottom:1px solid #eee; padding:14px 16px; display:flex; align-items:center; gap:12px; flex:0 0 auto; } .sheet-head .x { color:#555; font-size:17px; } .sheet-head .st { font-weight:600; font-size:15px; color:#111; outline:none; }
  .sheet-body { padding:16px; display:flex; flex-direction:column; gap:12px; flex:1 1 auto; overflow-y:auto; } .sheet-foot { padding:12px 16px 18px; flex:0 0 auto; border-top:1px solid #f0f0f0; }
  .submit { background:#0a7cff; color:#fff; text-align:center; padding:13px; border-radius:24px; font-weight:600; font-size:15px; outline:none; }
  .el { position:relative; border:1.5px solid transparent; border-radius:8px; padding:5px; cursor:pointer; }
  .el:hover { border-color:#dbe5ff; } .el.sel { border-color:var(--primary); }
  .el.drop-before { box-shadow:0 -3px 0 var(--primary); } .el.drop-after { box-shadow:0 3px 0 var(--primary); } .el.dragging { opacity:.4; }
  .el .drag { position:absolute; top:-10px; left:-10px; width:22px; height:22px; border-radius:7px; background:var(--primary); color:#fff; font-size:12px; display:none; place-items:center; cursor:grab; }
  .el.sel .drag { display:grid; }
  [contenteditable]:focus { outline:none; }
  .e-h { font-size:18px; font-weight:700; color:#111; } .e-sh { font-size:15px; font-weight:600; color:#111; } .e-b { font-size:14px; color:#333; line-height:1.4; } .e-c { font-size:12px; color:#777; }
  .e-lab { font-size:13px; font-weight:500; color:#333; margin-bottom:5px; } .e-box { border:1px solid #d0d0d0; border-radius:8px; padding:11px 12px; font-size:13px; color:#999; background:#fafafa; } .e-help { font-size:11px; color:#999; margin-top:4px; }
  .e-link { color:#0a7cff; font-weight:600; font-size:14px; text-align:center; padding:5px; }
  .e-opt { border:1px solid #e2e2e2; border-radius:8px; padding:9px 11px; font-size:13px; display:flex; align-items:center; gap:8px; margin-top:6px; color:#333; } .e-opt .mk { width:16px; height:16px; border:1.5px solid #bbb; border-radius:50%; flex:0 0 auto; } .e-opt.sq .mk { border-radius:4px; }
  .e-img { width:100%; border-radius:8px; display:block; } .ph-img { width:100%; height:120px; border-radius:8px; background:#eef0f5; display:grid; place-items:center; color:#9aa3b2; font-size:13px; }
  .prop .field { margin-bottom:12px; } .cnt { font-size:11px; color:var(--muted); text-align:right; margin-top:3px; } .cnt.over { color:var(--danger); font-weight:600; }
  .toggle { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text); margin-bottom:12px; }
  .opt-edit { display:flex; gap:6px; margin-bottom:6px; }
  .valbox .vi { font-size:12px; padding:7px 0; border-bottom:1px solid var(--border); display:flex; gap:6px; align-items:flex-start; } .valbox .vi:last-child { border-bottom:0; }
  .valbox .vi.err { color:var(--danger); } .valbox .vi.warn { color:#B45309; } .valbox .vi.ok { color:var(--ok); }
  .jsonwrap { position:relative; border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--panel); }
  .jsonwrap.bad { border-color:var(--danger); }
  .jl { position:absolute; inset:0; margin:0; padding:10px 12px; font:12px/1.5 ui-monospace,monospace; pointer-events:none; overflow:hidden; white-space:pre; }
  .jl .ln { display:block; height:18px; border-radius:3px; color:transparent; } .jl .ln.hl { background:#D7DEFF; box-shadow:inset 3px 0 0 var(--primary); } .jl .ln.err { background:#FEE2E2; box-shadow:inset 3px 0 0 var(--danger); }
  .jt { position:relative; display:block; width:100%; height:440px; resize:vertical; border:0; outline:none; padding:10px 12px; font:12px/1.5 ui-monospace,monospace; background:transparent; color:var(--text); white-space:pre; overflow:auto; }
  .jerr { color:var(--danger); font-size:12px; margin-top:8px; min-height:16px; }
  .stages { display:flex; flex-wrap:wrap; gap:20px; padding:4px 2px 16px; align-items:flex-start; }
  .screen-col { flex:0 0 auto; }
  .scr-bar { display:flex; align-items:center; gap:8px; margin-bottom:8px; padding:0 4px; }
  .scr-name { font-size:12px; font-weight:600; color:var(--muted); }
  .scr-bar.active .scr-name { color:var(--primary); font-weight:700; }
  .scr-drag { cursor:grab; color:var(--primary); font-size:14px; }
  .scr-rm { background:none; color:var(--danger); font-size:12px; padding:0 4px; }
  .screen-col.sd-before { box-shadow:-5px 0 0 var(--primary); } .screen-col.sd-after { box-shadow:5px 0 0 var(--primary); }
</style>
</head>
<body>
<div class="auth" id="auth">
  <div class="auth-card">
    <div class="brand">GARAGEM</div>
    <section id="v-login">
      <h1>Entrar no console</h1><p class="sub">Acesso restrito a e-mails @garagem.dev.br.</p>
      <div class="field"><label>E-mail</label><input class="in" id="li-email" type="email" placeholder="voce@garagem.dev.br" /></div>
      <div class="field"><label>Senha</label><input class="in" id="li-pass" type="password" autocomplete="current-password" /></div>
      <button class="btn" id="b-login">Entrar</button><button class="link" id="go-request">Primeiro acesso? Definir senha</button><div class="msg" id="li-msg"></div>
    </section>
    <section id="v-request" class="hidden">
      <h1>Primeiro acesso</h1><p class="sub">Enviaremos um código para o seu e-mail.</p>
      <div class="field"><label>E-mail</label><input class="in" id="rq-email" type="email" placeholder="voce@garagem.dev.br" /></div>
      <button class="btn" id="b-request">Enviar código</button><button class="link" id="go-login-1">Já tenho senha</button><div class="msg" id="rq-msg"></div>
    </section>
    <section id="v-setpass" class="hidden">
      <h1>Definir senha</h1><p class="sub">Informe o código e crie sua senha (mín. 10 caracteres).</p>
      <div class="field"><label>Código</label><input class="in" id="sp-code" inputmode="numeric" placeholder="000000" /></div>
      <div class="field"><label>Nova senha</label><input class="in" id="sp-pass" type="password" autocomplete="new-password" /></div>
      <button class="btn" id="b-setpass">Definir senha</button><button class="link" id="go-login-2">Voltar</button><div class="msg" id="sp-msg"></div>
    </section>
  </div>
</div>
<div class="app hidden" id="app">
  <button class="expand-btn hidden" id="side-expand" title="Expandir menu">»</button>
  <aside class="sidebar">
    <div class="logo-row"><div class="logo">Garagem</div><button class="collapse-btn" id="side-collapse" title="Recolher menu">«</button></div>
    <div class="side-head"><span>Produtos</span><button class="icon-btn" id="b-new-product" title="Novo produto">+</button></div>
    <div class="side-list" id="product-list"></div>
    <div class="side-foot"><div class="ue" id="user-email"></div><button class="btn ghost sm" id="b-logout" style="width:100%">Sair</button></div>
  </aside>
  <main class="main"><div class="topbar" id="topbar"></div><div class="content" id="content"><div class="empty">Selecione ou crie um produto para começar.</div></div></main>
</div>
<div class="modal hidden" id="np-modal">
  <div class="modal-card"><h3>Novo produto</h3>
    <div class="field"><label>Nome</label><input class="in" id="np-name" placeholder="App de Psicólogos" /></div>
    <div class="field"><label>Slug</label><input class="in" id="np-slug" placeholder="app-psicologos" /></div>
    <div class="field"><label>Origens permitidas (vírgula)</label><input class="in" id="np-origins" placeholder="https://app.garagem.dev" /></div>
    <div class="inline-actions" style="justify-content:flex-end"><button class="btn ghost" id="np-cancel">Cancelar</button><button class="btn" id="np-create">Criar produto</button></div>
    <div class="msg" id="np-msg"></div>
  </div>
</div>
<script>
  var DREF = "$" + "{data.";
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  function msg(id, t, k) { var e = $(id); e.textContent = t || ""; e.className = "msg" + (k ? " " + k : ""); }
  async function api(p, b) { var r = await fetch(p, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(b || {}) }); var d = {}; try { d = await r.json(); } catch (e) {} return { ok: r.ok, status: r.status, data: d }; }
  async function apiGet(p) { var r = await fetch(p, { credentials: "same-origin" }); var d = {}; try { d = await r.json(); } catch (e) {} return { ok: r.ok, status: r.status, data: d }; }
  var setEmail = "", selected = null, curTab = "keys";
  function showAuth(v) { $("app").classList.add("hidden"); $("auth").classList.remove("hidden"); ["login", "request", "setpass"].forEach(function (x) { $("v-" + x).classList.toggle("hidden", x !== v); }); }
  function showApp() { $("auth").classList.add("hidden"); $("app").classList.remove("hidden"); loadProducts(); }
  $("go-request").onclick = function () { showAuth("request"); }; $("go-login-1").onclick = function () { showAuth("login"); }; $("go-login-2").onclick = function () { showAuth("login"); };
  $("b-request").onclick = async function () { var e = $("rq-email").value.trim(); $("b-request").disabled = true; msg("rq-msg", "Enviando...", ""); await api("/auth/request-code", { email: e }); $("b-request").disabled = false; setEmail = e; msg("sp-msg", "Se o e-mail for válido, o código foi enviado.", "ok"); showAuth("setpass"); };
  $("b-setpass").onclick = async function () { var r = await api("/auth/set-password", { email: setEmail, code: $("sp-code").value.trim(), password: $("sp-pass").value }); if (r.ok) { msg("li-msg", "Senha definida. Faça login.", "ok"); showAuth("login"); $("li-email").value = setEmail; } else { msg("sp-msg", (r.data && r.data.error) || "Erro.", "error"); } };
  $("b-login").onclick = async function () { var e = $("li-email").value.trim(); $("b-login").disabled = true; msg("li-msg", "Entrando...", ""); var r = await api("/auth/login", { email: e, password: $("li-pass").value }); $("b-login").disabled = false; if (r.ok) { $("user-email").textContent = (r.data && r.data.email) || e; showApp(); } else { msg("li-msg", (r.data && r.data.error) || "Credenciais inválidas.", "error"); } };
  $("b-logout").onclick = async function () { await api("/auth/logout", {}); selected = null; showAuth("login"); };
  $("side-collapse").onclick = function () { $("app").classList.add("collapsed"); $("side-expand").classList.remove("hidden"); };
  $("side-expand").onclick = function () { $("app").classList.remove("collapsed"); $("side-expand").classList.add("hidden"); };
  $("b-new-product").onclick = function () { $("np-modal").classList.remove("hidden"); }; $("np-cancel").onclick = function () { $("np-modal").classList.add("hidden"); };
  $("np-create").onclick = async function () { var origins = $("np-origins").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); var r = await api("/api/products", { name: $("np-name").value.trim(), slug: $("np-slug").value.trim(), allowed_origins: origins }); if (r.ok) { $("np-name").value = ""; $("np-slug").value = ""; $("np-origins").value = ""; $("np-modal").classList.add("hidden"); selected = r.data.id; loadProducts(); } else { msg("np-msg", (r.data && r.data.error) || "Erro ao criar.", "error"); } };

  async function loadProducts() {
    var r = await apiGet("/api/products"); var list = $("product-list"); list.textContent = "";
    var products = (r.data && r.data.products) || [];
    if (!products.length) { list.appendChild(el("div", "empty", "Nenhum produto.")); $("content").innerHTML = ""; $("content").appendChild(el("div", "empty", "Crie seu primeiro produto no +.")); $("topbar").textContent = ""; return; }
    products.forEach(function (p) { var it = el("div", "side-item" + (selected === p.id ? " active" : "")); it.appendChild(el("div", null, p.name)); it.appendChild(el("div", "s2", p.slug)); it.onclick = function () { selected = p.id; curTab = "keys"; loadProducts(); }; list.appendChild(it); });
    var cur = products.filter(function (p) { return p.id === selected; })[0] || null;
    if (cur) openProduct(cur); else { $("topbar").textContent = ""; $("content").innerHTML = ""; $("content").appendChild(el("div", "empty", "Selecione um produto.")); }
  }
  function openProduct(p) {
    var tb = $("topbar"); tb.textContent = ""; tb.appendChild(el("h2", null, p.name)); tb.appendChild(el("div", "tsub", p.slug + (p.allowed_origins && p.allowed_origins.length ? " · " + p.allowed_origins.join(", ") : "")));
    var tabs = el("div", "tabs");
    [["keys", "Chaves de API"], ["multitenant", "Multitenant"], ["templates", "Templates"], ["flows", "Flows"], ["metrics", "Métricas"]].forEach(function (t) { var b = el("button", "tab" + (curTab === t[0] ? " active" : ""), t[1]); b.onclick = function () { curTab = t[0]; openProduct(p); }; tabs.appendChild(b); });
    tb.appendChild(tabs); var c = $("content"); c.textContent = "";
    if (curTab === "keys") return renderKeys(p, c); if (curTab === "multitenant") return loadMultitenant(p, c); if (curTab === "templates") return loadTemplates(p, c); if (curTab === "flows") return loadFlows(p, c); renderMetrics(p, c);
  }
  function renderMetrics(p, c) { c.appendChild(el("div", "empty", "Carregando métricas...")); api("/api/products/" + p.id + "/embed-token", { class: "metrics" }).then(function (r) { c.textContent = ""; if (!r.ok || !r.data.embed_token) { c.appendChild(el("div", "empty", "Não foi possível carregar.")); return; } var card = el("div", "card"); var f = document.createElement("iframe"); f.className = "screen-frame"; f.src = "/v1/screen/metrics?t=" + encodeURIComponent(r.data.embed_token); card.appendChild(f); c.appendChild(card); }); }
  function renderKeys(p, c) {
    var card = el("div", "card"); var head = el("div", "row-head"); head.appendChild(el("h3", null, "Chaves de API")); var gen = el("button", "btn sm", "Gerar nova chave"); head.appendChild(gen); card.appendChild(head);
    var box = el("div"); card.appendChild(box); var reveal = el("div"); card.appendChild(reveal); c.appendChild(card);
    gen.onclick = async function () { var r = await api("/api/products/" + p.id + "/keys", {}); if (r.ok && r.data.key) { reveal.textContent = ""; var rv = el("div", "reveal"); rv.appendChild(el("span", "warn", "Copie agora — não será exibida novamente.")); rv.appendChild(document.createTextNode(r.data.key)); reveal.appendChild(rv); loadKeys(); } };
    async function loadKeys() { var r = await apiGet("/api/products/" + p.id + "/keys"); box.textContent = ""; var keys = (r.data && r.data.keys) || []; if (!keys.length) { box.appendChild(el("div", "empty", "Nenhuma chave gerada.")); return; } keys.forEach(function (k) { var row = el("div", "list-row"); var left = el("div"); left.appendChild(el("code", null, k.key_id + "…" + k.last_four)); row.appendChild(left); var right = el("div", "inline-actions"); right.appendChild(el("span", "badge" + (k.status === "active" ? " green" : " red"), k.status)); if (k.status === "active") { var rev = el("button", "btn danger", "revogar"); rev.onclick = async function () { await api("/api/keys/" + k.id + "/revoke", {}); loadKeys(); }; right.appendChild(rev); } row.appendChild(right); box.appendChild(row); }); }
    loadKeys();
  }
  function inp(ph, val) { var i = el("input", "in"); i.placeholder = ph || ""; if (val) i.value = val; return i; }
  function selOf(items, vf, lf) { var s = el("select", "in"); items.forEach(function (it) { var o = document.createElement("option"); o.value = vf(it); o.textContent = lf(it); s.appendChild(o); }); return s; }
  async function loadMultitenant(p, c) {
    var r = await apiGet("/api/products/" + p.id + "/tenants"); var companies = (r.data && r.data.companies) || [], wabas = (r.data && r.data.wabas) || [], numbers = (r.data && r.data.numbers) || [];
    var form = el("div", "card"); form.appendChild(el("h3", null, "Nova empresa cliente")); var nm = inp("Nome da empresa"), ext = inp("Referência externa (opcional)"); var g = el("div", "grid2"); g.appendChild(nm); g.appendChild(ext); form.appendChild(g);
    var add = el("button", "btn sm", "Adicionar empresa"); add.style.marginTop = "12px"; add.onclick = async function () { if (!nm.value.trim()) return; await api("/api/products/" + p.id + "/tenants", { name: nm.value.trim(), external_ref: ext.value.trim() || null }); loadMultitenant(p, c); }; form.appendChild(add); c.textContent = ""; c.appendChild(form);
    if (!companies.length) { c.appendChild(el("div", "empty", "Nenhuma empresa cadastrada ainda.")); return; }
    companies.forEach(function (co) {
      var card = el("div", "card"); card.appendChild(el("h3", null, co.name + (co.external_ref ? "  ·  " + co.external_ref : "")));
      wabas.filter(function (w) { return w.company_id === co.id; }).forEach(function (w) { card.appendChild(el("div", "l2", "WABA " + w.waba_id_meta)); var pn = inp("Phone Number ID (Meta)"), dn = inp("Nome de exibição"), dp = inp("Telefone"); var bar = el("div", "inline-actions"); [pn, dn, dp].forEach(function (x) { bar.appendChild(x); }); var b = el("button", "btn sm ghost", "+ número"); bar.appendChild(b); b.onclick = async function () { if (!pn.value.trim()) return; await api("/api/products/" + p.id + "/wabas/" + w.id + "/numbers", { phone_number_id_meta: pn.value.trim(), display_name: dn.value.trim() || null, display_phone: dp.value.trim() || null }); loadMultitenant(p, c); }; bar.style.margin = "6px 0 12px"; card.appendChild(bar); });
      var wid = inp("ID da WABA (Meta)"), wn = inp("Nome (opcional)"); var wbar = el("div", "inline-actions"); wbar.appendChild(wid); wbar.appendChild(wn); var wb = el("button", "btn sm ghost", "+ WABA"); wbar.appendChild(wb); wb.onclick = async function () { if (!wid.value.trim()) return; await api("/api/products/" + p.id + "/tenants/" + co.id + "/wabas", { waba_id_meta: wid.value.trim(), name: wn.value.trim() || null }); loadMultitenant(p, c); }; card.appendChild(wbar);
      numbers.filter(function (n) { return n.company_id === co.id; }).forEach(function (n) { var row = el("div", "list-row"); var left = el("div"); left.appendChild(el("div", "l1", n.display_name || n.phone_number_id_meta)); if (n.display_phone) left.appendChild(el("div", "l2", n.display_phone)); row.appendChild(left); row.appendChild(el("span", "badge", n.quality_rating)); card.appendChild(row); });
      c.appendChild(card);
    });
  }
  async function loadTemplates(p, c) {
    var tr = await apiGet("/api/products/" + p.id + "/tenants"); var wabas = (tr.data && tr.data.wabas) || [];
    var form = el("div", "card"); form.appendChild(el("h3", null, "Novo template"));
    if (!wabas.length) { form.appendChild(el("div", "empty", "Cadastre uma WABA na aba Multitenant primeiro.")); }
    else { var ws = selOf(wabas, function (w) { return w.id; }, function (w) { return w.company_name + " · " + w.waba_id_meta; }); var nm = inp("nome_do_template"), lg = inp("Idioma", "pt_BR"), ct = selOf(["utility", "marketing", "authentication"], function (v) { return v; }, function (v) { return v; }); var bt = el("textarea", "in"); bt.placeholder = "Corpo da mensagem (use {{1}} para variáveis)"; var f1 = el("div", "field"); f1.appendChild(el("label", null, "Empresa / WABA")); f1.appendChild(ws); form.appendChild(f1); var g = el("div", "grid2"); var f2 = el("div", "field"); f2.appendChild(el("label", null, "Nome")); f2.appendChild(nm); var f3 = el("div", "field"); f3.appendChild(el("label", null, "Idioma")); f3.appendChild(lg); g.appendChild(f2); g.appendChild(f3); form.appendChild(g); var f4 = el("div", "field"); f4.appendChild(el("label", null, "Categoria")); f4.appendChild(ct); form.appendChild(f4); var f5 = el("div", "field"); f5.appendChild(el("label", null, "Corpo")); f5.appendChild(bt); form.appendChild(f5); var m = el("div", "msg"); var b = el("button", "btn sm", "Criar template"); b.onclick = async function () { var r = await api("/api/products/" + p.id + "/templates", { waba_id: ws.value, name: nm.value.trim(), language: lg.value.trim() || "pt_BR", category: ct.value, components: { body: { text: bt.value } } }); if (r.ok) loadTemplates(p, c); else { m.textContent = (r.data.detalhes && r.data.detalhes.join("; ")) || r.data.error || "erro"; m.className = "msg error"; } }; form.appendChild(b); form.appendChild(m); }
    c.textContent = ""; c.appendChild(form);
    var lr = await apiGet("/api/products/" + p.id + "/templates"); var templates = (lr.data && lr.data.templates) || []; var listCard = el("div", "card"); listCard.appendChild(el("h3", null, "Templates (" + templates.length + ")")); if (!templates.length) listCard.appendChild(el("div", "empty", "Nenhum template.")); templates.forEach(function (t) { var row = el("div", "list-row"); var left = el("div"); left.appendChild(el("div", "l1", t.name)); left.appendChild(el("div", "l2", t.language + " · " + t.category)); row.appendChild(left); row.appendChild(el("span", "badge", t.status)); listCard.appendChild(row); }); c.appendChild(listCard);
  }

  /* ===================== FLOWS ===================== */
  var LIM = { heading: 80, subheading: 80, body: 4096, caption: 4096, footer: 35, link: 35, inputLabel: 20, taLabel: 20, helper: 80, selLabel: 30, dateLabel: 40, title: 30 };
  function normalizeBuilder(j) { if (j && j.builder && j.builder.screens) return j.builder; return { screens: [{ id: "TELA_1", title: "Tela 1", variables: [], components: [] }] }; }
  function newEl(t) {
    if (t === "heading") return { t: t, text: "Título" }; if (t === "subheading") return { t: t, text: "Subtítulo" };
    if (t === "body") return { t: t, text: "Texto do parágrafo" }; if (t === "caption") return { t: t, text: "Legenda" };
    if (t === "image") return { t: t, src: "", alt: "" };
    if (t === "input") return { t: t, name: "campo", label: "Rótulo", inputType: "text", required: false, helper: "", maxChars: "" };
    if (t === "textarea") return { t: t, name: "texto", label: "Rótulo", required: false, helper: "", maxLength: "" };
    if (t === "dropdown" || t === "radio" || t === "checkbox") return { t: t, name: "opcao", label: "Escolha uma opção", required: false, options: ["Opção 1", "Opção 2"] };
    if (t === "date") return { t: t, name: "data", label: "Data", required: false, helper: "" };
    if (t === "footer") return { t: t, label: "Continuar" };
    if (t === "link") return { t: t, text: "Sim", action: "navigate", target: "", url: "" };
  }
  function isInput(t) { return ["input", "textarea", "dropdown", "radio", "checkbox", "date"].indexOf(t) >= 0; }
  function limitOf(cp) { if (cp.t === "footer") return LIM.footer; if (cp.t === "link") return LIM.link; if (cp.t === "input" || cp.t === "textarea") return LIM.inputLabel; if (cp.t === "dropdown" || cp.t === "radio" || cp.t === "checkbox") return LIM.selLabel; if (cp.t === "date") return LIM.dateLabel; return LIM[cp.t] || 9999; }
  function textField(cp) { return cp.t === "footer" ? "label" : (isInput(cp.t) ? "label" : "text"); }
  function mapComp(cp) {
    if (cp.t === "heading") return { type: "TextHeading", text: cp.text || "" }; if (cp.t === "subheading") return { type: "TextSubheading", text: cp.text || "" };
    if (cp.t === "body") return { type: "TextBody", text: cp.text || "" }; if (cp.t === "caption") return { type: "TextCaption", text: cp.text || "" };
    if (cp.t === "image") return { type: "Image", src: cp.src || "", "scale-type": "contain", "alt-text": cp.alt || "" };
    if (cp.t === "input") { var o = { type: "TextInput", name: cp.name, label: cp.label, "input-type": cp.inputType || "text", required: !!cp.required }; if (cp.helper) o["helper-text"] = cp.helper; if (cp.maxChars) o["max-chars"] = Number(cp.maxChars); return o; }
    if (cp.t === "textarea") { var o2 = { type: "TextArea", name: cp.name, label: cp.label, required: !!cp.required }; if (cp.helper) o2["helper-text"] = cp.helper; if (cp.maxLength) o2["max-length"] = Number(cp.maxLength); return o2; }
    if (cp.t === "dropdown" || cp.t === "radio" || cp.t === "checkbox") { var tt = { dropdown: "Dropdown", radio: "RadioButtonsGroup", checkbox: "CheckboxGroup" }[cp.t]; return { type: tt, name: cp.name, label: cp.label, required: !!cp.required, "data-source": (cp.options || []).map(function (o, i) { return { id: String(i), title: o }; }) }; }
    if (cp.t === "date") { var o3 = { type: "DatePicker", name: cp.name, label: cp.label, required: !!cp.required }; if (cp.helper) o3["helper-text"] = cp.helper; return o3; }
    if (cp.t === "link") { var oc = cp.action === "open_url" ? { name: "open_url", url: cp.url || "" } : { name: "navigate", next: { type: "screen", name: cp.target || "" }, payload: {} }; return { type: "EmbeddedLink", text: cp.text || "", "on-click-action": oc }; }
    return null;
  }
  function exportFlow(model) {
    var screens = model.screens.map(function (s, idx) {
      var last = idx === model.screens.length - 1; var children = [], formCh = [], hasInput = false, footer = null;
      (s.components || []).forEach(function (cp) { if (cp.t === "footer") { footer = cp; return; } var m = mapComp(cp); if (!m) return; if (isInput(cp.t)) { hasInput = true; formCh.push(m); } else children.push(m); });
      var footerComp = { type: "Footer", label: (footer && footer.label) || "Continuar", "on-click-action": last ? { name: "complete", payload: {} } : { name: "navigate", next: { type: "screen", name: model.screens[idx + 1].id }, payload: {} } };
      if (hasInput) { formCh.push(footerComp); children.push({ type: "Form", name: "form", children: formCh }); } else if (footer) children.push(footerComp);
      var scr = { id: s.id, title: s.title, terminal: last, layout: { type: "SingleColumnLayout", children: children } };
      var data = {}; (s.variables || []).forEach(function (v) { data[v.name] = { type: v.type || "string", __example__: v.example || "" }; }); if (Object.keys(data).length) scr.data = data;
      return scr;
    });
    return { version: "7.0", screens: screens };
  }
  function validate(model) {
    var out = [];
    model.screens.forEach(function (s, si) {
      var prefix = "Tela " + (si + 1) + ": "; if ((s.title || "").length > LIM.title) out.push({ k: "err", m: prefix + "título com " + s.title.length + "/" + LIM.title });
      var imgs = 0, footers = 0, links = 0, names = {};
      (s.components || []).forEach(function (cp) {
        var tf = textField(cp), val = (cp[tf] || "");
        if (val.length > limitOf(cp)) out.push({ k: "err", m: prefix + 'texto "' + val.slice(0, 14) + '…" com ' + val.length + "/" + limitOf(cp) + " caracteres" });
        if (isInput(cp.t) && !val.trim()) out.push({ k: "err", m: prefix + "um campo está sem rótulo" });
        if (cp.helper && cp.helper.length > LIM.helper) out.push({ k: "err", m: prefix + "ajuda com " + cp.helper.length + "/" + LIM.helper });
        if (isInput(cp.t)) { if (names[cp.name]) out.push({ k: "err", m: prefix + 'name "' + cp.name + '" repetido' }); names[cp.name] = 1; }
        if (cp.t === "image") { imgs++; if (!cp.src) out.push({ k: "warn", m: prefix + "imagem sem arquivo" }); }
        if (cp.t === "footer") footers++;
        if (cp.t === "link") { links++; if (!(cp.text || "").trim()) out.push({ k: "err", m: prefix + "link sem texto (obrigatório)" }); if ((cp.action || "navigate") === "navigate" && !cp.target) out.push({ k: "warn", m: prefix + "link sem tela de destino" }); if (cp.action === "open_url" && !(cp.url || "").trim()) out.push({ k: "warn", m: prefix + "link sem URL" }); }
        if ((cp.t === "dropdown" || cp.t === "radio" || cp.t === "checkbox") && (cp.options || []).length < 1) out.push({ k: "err", m: prefix + "lista sem opções" });
      });
      if (imgs > 3) out.push({ k: "err", m: prefix + "máximo de 3 imagens por tela (tem " + imgs + ")" });
      if (footers > 1) out.push({ k: "err", m: prefix + "apenas um botão de rodapé por tela (regra do WhatsApp)" });
      if (links > 2) out.push({ k: "err", m: prefix + "máximo de 2 links por tela (regra do WhatsApp; tem " + links + ")" });
      if (si === model.screens.length - 1 && footers === 0) out.push({ k: "warn", m: prefix + "tela final precisa de um botão para enviar" });
    });
    return out;
  }
  function screenJsonWithRanges(s) {
    var lines = ["{"]; lines.push('  "id": ' + JSON.stringify(s.id) + ","); lines.push('  "title": ' + JSON.stringify(s.title || "") + ",");
    if (s.variables && s.variables.length) lines.push('  "variables": ' + JSON.stringify(s.variables) + ",");
    lines.push('  "components": ['); var ranges = [];
    (s.components || []).forEach(function (cp, i) { var block = JSON.stringify(cp, null, 2).split("\\n").map(function (l) { return "    " + l; }); var start = lines.length; block.forEach(function (bl) { lines.push(bl); }); if (i < s.components.length - 1) lines[lines.length - 1] += ","; ranges.push({ idx: i, start: start, end: lines.length - 1 }); });
    lines.push("  ]"); lines.push("}"); return { text: lines.join("\\n"), ranges: ranges };
  }
  function imgToken(src) { var m = (src || "").match(/^data:([^;]+)/); return "data:" + (m ? m[1] : "image") + ";base64,…(imagem mantida)…"; }
  function displayScreen(s) { return { id: s.id, title: s.title, variables: s.variables, components: (s.components || []).map(function (cp) { if (cp.t === "image" && cp.src) { var c = {}; for (var k in cp) c[k] = cp[k]; c.src = imgToken(cp.src); return c; } return cp; }) }; }

  async function loadFlows(p, c) {
    c.textContent = ""; var head = el("div", "row-head"); head.appendChild(el("h3", null, "Flows")); var nb = el("button", "btn sm", "+ Novo flow"); head.appendChild(nb); var wrap = el("div", "card"); wrap.appendChild(head);
    var lr = await apiGet("/api/products/" + p.id + "/flows"); var flows = (lr.data && lr.data.flows) || []; if (!flows.length) wrap.appendChild(el("div", "empty", "Nenhum flow. Crie um no construtor visual."));
    flows.forEach(function (f) { var row = el("div", "list-row"); var left = el("div"); left.appendChild(el("div", "l1", f.name)); row.appendChild(left); var right = el("div", "inline-actions"); right.appendChild(el("span", "badge", f.status)); var ed = el("button", "btn sm ghost", "Editar"); right.appendChild(ed); row.appendChild(right); ed.onclick = async function () { var d = await apiGet("/api/products/" + p.id + "/flows/" + f.id); openBuilder(p, c, { id: f.id, name: f.name, model: normalizeBuilder(d.data && d.data.flow_json) }); }; wrap.appendChild(row); });
    c.appendChild(wrap); nb.onclick = function () { openBuilder(p, c, null); };
  }

  function openBuilder(p, c, existing) {
    var st = { id: existing ? existing.id : null, name: existing ? existing.name : "", model: existing ? existing.model : normalizeBuilder(null), scr: 0, sel: -1, jsonMode: false, drag: null, dragScr: null, screenDrag: null, nodes: {}, textNodes: {}, ui: {}, jsonRanges: [], jsonLines: null, jsonTextarea: null };
    c.textContent = "";
    var top = el("div", "fb-top"); var nameIn = inp("Nome do flow"); nameIn.value = st.name; nameIn.oninput = function () { st.name = nameIn.value; }; top.appendChild(nameIn);
    var acts = el("div", "inline-actions"); var jsonBtn = el("button", "btn ghost", "Ver JSON"); var back = el("button", "btn ghost", "Voltar"); back.onclick = function () { loadFlows(p, c); }; var save = el("button", "btn", "Salvar flow"); acts.appendChild(jsonBtn); acts.appendChild(back); acts.appendChild(save); top.appendChild(acts); c.appendChild(top);
    var smsg = el("div", "msg"); c.appendChild(smsg);
    var fb = el("div", "fb"); var left = el("div", "fb-pane"), center = el("div"), right = el("div", "fb-pane prop"); fb.appendChild(left); fb.appendChild(center); fb.appendChild(right); c.appendChild(fb);
    function screen() { return st.model.screens[st.scr]; }

    function renderLeft() {
      left.textContent = "";
      var scrs = el("div", "scrs"); st.model.screens.forEach(function (s, i) { var b = el("button", "s" + (i === st.scr ? " active" : ""), s.title || ("Tela " + (i + 1))); b.onclick = function () { st.scr = i; st.sel = -1; renderAll(); }; scrs.appendChild(b); });
      var addS = el("button", "s", "+ Tela"); addS.onclick = function () { var n = st.model.screens.length + 1; st.model.screens.push({ id: "TELA_" + n, title: "Tela " + n, variables: [], components: [] }); st.scr = st.model.screens.length - 1; st.sel = -1; renderAll(); }; scrs.appendChild(addS); left.appendChild(scrs);
      if (st.model.screens.length > 1) { var del = el("button", "btn danger", "remover tela"); del.onclick = function () { st.model.screens.splice(st.scr, 1); st.scr = 0; st.sel = -1; renderAll(); }; left.appendChild(del); }
      left.appendChild(el("h4", null, "Elementos")); var pal = el("div", "pal");
      [["heading", "Cabeçalho"], ["subheading", "Subtítulo"], ["body", "Parágrafo"], ["caption", "Legenda"], ["image", "Imagem"], ["input", "Campo de texto"], ["textarea", "Área de texto"], ["dropdown", "Lista suspensa"], ["radio", "Escolha única"], ["checkbox", "Múltipla escolha"], ["date", "Data"], ["footer", "Botão (rodapé)"], ["link", "Botão / link (Sim, Não…)"]].forEach(function (t) { var b = el("button", null, t[1]); b.onclick = function () { screen().components.push(newEl(t[0])); st.sel = screen().components.length - 1; renderAll(); }; pal.appendChild(b); }); left.appendChild(pal);
      left.appendChild(el("h4", null, "Variáveis"));
      (screen().variables || []).forEach(function (v, i) { var row = el("div", "var"); var chip = el("button", "chip", DREF + v.name + "}"); chip.title = "Inserir no texto selecionado"; chip.onclick = function () { document.execCommand("insertText", false, DREF + v.name + "}"); }; row.appendChild(chip); var x = el("button", "btn danger", "✕"); x.onclick = function () { screen().variables.splice(i, 1); renderAll(); }; row.appendChild(x); left.appendChild(row); });
      var vn = inp("nome_da_variavel"); var vadd = el("button", "btn sm ghost", "+ variável"); vadd.style.marginTop = "8px"; vadd.onclick = function () { var n = vn.value.trim().replace(/[^a-zA-Z0-9_]/g, "_"); if (!n) return; if (!screen().variables) screen().variables = []; screen().variables.push({ name: n, type: "string", example: "" }); renderAll(); }; left.appendChild(vn); left.appendChild(vadd);
    }

    function key(s, i) { return s + "_" + i; }
    function clearDrops() { for (var k in st.nodes) { if (st.nodes[k]) { st.nodes[k].classList.remove("drop-before"); st.nodes[k].classList.remove("drop-after"); } } }
    function clearScreenDrops() { var cs = center.querySelectorAll(".screen-col"); for (var i = 0; i < cs.length; i++) { cs[i].classList.remove("sd-before"); cs[i].classList.remove("sd-after"); } }
    function markActiveScreen() { var bars = center.querySelectorAll(".scr-bar"); for (var i = 0; i < bars.length; i++) bars[i].classList.toggle("active", i === st.scr); }
    function markSel() { for (var k in st.nodes) { if (st.nodes[k]) st.nodes[k].classList.toggle("sel", k === key(st.scr, st.sel)); } if (st.jsonMode) highlightJsonLines(st.sel); }
    function selectEl(sIdx, idx) { var changed = st.scr !== sIdx; st.scr = sIdx; st.sel = idx; markSel(); markActiveScreen(); if (st.jsonMode) { if (changed) renderJson(); else highlightJsonLines(idx); } else renderRight(); }
    function editable(cls, sIdx, idx, getV, setV) { var d = el("div", cls); d.contentEditable = "true"; d.spellcheck = false; d.textContent = getV() || ""; st.textNodes[key(sIdx, idx)] = d; d.onfocus = function () { selectEl(sIdx, idx); }; d.oninput = function () { setV(d.textContent); if (st.ui.ti && st.scr === sIdx && st.sel === idx) st.ui.ti.value = d.textContent; updCounter(); renderValidationOnly(); }; return d; }
    function removeScreen(i) { st.model.screens.splice(i, 1); if (st.scr >= st.model.screens.length) st.scr = st.model.screens.length - 1; st.sel = -1; renderAll(); }
    function reorderScreen(from, to) { if (from == null || to == null || from === to) return; var a = st.model.screens; var item = a[from]; a.splice(from, 1); if (to > from) to--; a.splice(to, 0, item); st.scr = to; st.sel = -1; renderAll(); }

    function buildSheet(s, sIdx) {
      var sheet = el("div", "sheet"); var sh = el("div", "sheet-head"); sh.appendChild(el("span", "x", "✕"));
      var stt = el("div", "st"); stt.contentEditable = "true"; stt.spellcheck = false; stt.textContent = s.title || ""; stt.onfocus = function () { st.scr = sIdx; st.sel = -1; markActiveScreen(); if (!st.jsonMode) renderRight(); }; stt.oninput = function () { s.title = stt.textContent; renderValidationOnly(); }; sh.appendChild(stt); sheet.appendChild(sh);
      var body = el("div", "sheet-body"); var foot = el("div", "sheet-foot");
      (s.components || []).forEach(function (cp, idx) {
        var wrap = el("div", "el" + (sIdx === st.scr && idx === st.sel ? " sel" : "")); st.nodes[key(sIdx, idx)] = wrap; wrap.appendChild(el("div", "drag", "⠿"));
        if (cp.t !== "footer") {
          wrap.draggable = true;
          wrap.ondragstart = function (e) { st.drag = idx; st.dragScr = sIdx; wrap.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.stopPropagation(); };
          wrap.ondragend = function () { wrap.classList.remove("dragging"); clearDrops(); st.drag = null; };
          wrap.ondragover = function (e) { if (st.drag == null || st.dragScr !== sIdx || st.drag === idx) return; e.preventDefault(); e.stopPropagation(); var r = wrap.getBoundingClientRect(); var after = (e.clientY - r.top) > r.height / 2; clearDrops(); wrap.classList.add(after ? "drop-after" : "drop-before"); st.dropTo = after ? idx + 1 : idx; };
          wrap.ondrop = function (e) { if (st.drag == null || st.dragScr !== sIdx) return; e.preventDefault(); e.stopPropagation(); clearDrops(); var from = st.drag, to = st.dropTo; if (to == null) return; var a = s.components; var item = a[from]; a.splice(from, 1); if (to > from) to--; a.splice(to, 0, item); st.scr = sIdx; st.sel = to; st.drag = null; renderStage(); if (!st.jsonMode) renderRight(); else { rebuildJsonRanges(); highlightJsonLines(st.sel); } };
        }
        wrap.onclick = function (e) { if (e.target.getAttribute && e.target.getAttribute("contenteditable") === "true") return; selectEl(sIdx, idx); };
        if (cp.t === "heading") wrap.appendChild(editable("e-h", sIdx, idx, function () { return cp.text; }, function (v) { cp.text = v; }));
        else if (cp.t === "subheading") wrap.appendChild(editable("e-sh", sIdx, idx, function () { return cp.text; }, function (v) { cp.text = v; }));
        else if (cp.t === "body") wrap.appendChild(editable("e-b", sIdx, idx, function () { return cp.text; }, function (v) { cp.text = v; }));
        else if (cp.t === "caption") wrap.appendChild(editable("e-c", sIdx, idx, function () { return cp.text; }, function (v) { cp.text = v; }));
        else if (cp.t === "image") { if (cp.src) { var im = el("img", "e-img"); im.src = cp.src; wrap.appendChild(im); } else wrap.appendChild(el("div", "ph-img", "Imagem (envie no painel →)")); }
        else if (cp.t === "footer") { wrap.appendChild(editable("submit", sIdx, idx, function () { return cp.label; }, function (v) { cp.label = v; })); foot.appendChild(wrap); return; }
        else if (cp.t === "link") wrap.appendChild(editable("e-link", sIdx, idx, function () { return cp.text; }, function (v) { cp.text = v; }));
        else if (isInput(cp.t)) { wrap.appendChild(editable("e-lab", sIdx, idx, function () { return cp.label; }, function (v) { cp.label = v; })); if (cp.t === "input" || cp.t === "textarea") wrap.appendChild(el("div", "e-box", cp.t === "textarea" ? "Texto longo..." : "Digite...")); else if (cp.t === "date") wrap.appendChild(el("div", "e-box", "DD/MM/AAAA  📅")); else { (cp.options || []).forEach(function (op) { var o = el("div", "e-opt" + (cp.t === "checkbox" ? " sq" : "")); o.appendChild(el("span", "mk")); o.appendChild(el("span", null, op)); wrap.appendChild(o); }); } if (cp.helper) wrap.appendChild(el("div", "e-help", cp.helper)); }
        else wrap.appendChild(el("div", "e-b", "(" + cp.t + ")"));
        if (cp.t !== "footer") body.appendChild(wrap);
      });
      sheet.appendChild(body); sheet.appendChild(foot); return sheet;
    }

    function renderStage() {
      center.textContent = ""; st.nodes = {}; st.textNodes = {};
      var row = el("div", "stages");
      st.model.screens.forEach(function (s, sIdx) {
        var col = el("div", "screen-col");
        var bar = el("div", "scr-bar" + (sIdx === st.scr ? " active" : ""));
        var dh = el("div", "scr-drag", "⠿"); dh.draggable = true; dh.ondragstart = function (e) { st.screenDrag = sIdx; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text", "s"); }; bar.appendChild(dh);
        bar.appendChild(el("span", "scr-name", "Tela " + (sIdx + 1)));
        if (st.model.screens.length > 1) { var rmb = el("button", "scr-rm", "✕"); rmb.title = "Remover tela"; rmb.onclick = function () { removeScreen(sIdx); }; bar.appendChild(rmb); }
        col.ondragover = function (e) { if (st.screenDrag == null) return; e.preventDefault(); var r = col.getBoundingClientRect(); var after = (e.clientX - r.left) > r.width / 2; clearScreenDrops(); col.classList.add(after ? "sd-after" : "sd-before"); st.screenDropTo = after ? sIdx + 1 : sIdx; };
        col.ondrop = function (e) { if (st.screenDrag == null) return; e.preventDefault(); var f = st.screenDrag, t = st.screenDropTo; st.screenDrag = null; clearScreenDrops(); reorderScreen(f, t); };
        col.ondragend = function () { st.screenDrag = null; clearScreenDrops(); };
        col.appendChild(bar); col.appendChild(buildSheet(s, sIdx)); row.appendChild(col);
      });
      center.appendChild(row);
    }

    function updCounter() { var cp = screen().components[st.sel]; if (!cp || !st.ui.cnt) return; var v = (cp[st.ui.tf] || "").length; st.ui.cnt.textContent = v + " / " + st.ui.lim + " caracteres"; st.ui.cnt.classList.toggle("over", v > st.ui.lim); }
    var valBox = null;
    function renderValidationOnly() { if (!valBox) return; valBox.textContent = ""; var errs = validate(st.model); if (!errs.length) { valBox.appendChild(el("div", "vi ok", "Sem erros. Pronto para salvar.")); return; } errs.forEach(function (e) { valBox.appendChild(el("div", "vi " + e.k, (e.k === "err" ? "✕ " : "! ") + e.m)); }); }

    function renderRight() {
      if (st.jsonMode) { renderJson(); return; }
      right.textContent = ""; right.appendChild(el("h4", null, "Propriedades")); var cp = screen().components[st.sel]; st.ui = {};
      if (!cp) { right.appendChild(el("div", "muted", "Selecione um elemento no canvas para editar.")); }
      else {
        if (cp.t !== "image") {
          var tf = textField(cp), lim = limitOf(cp); var lf = el("div", "field"); lf.appendChild(el("label", null, (cp.t === "footer" || cp.t === "link") ? "Texto do botão" : (isInput(cp.t) ? "Rótulo" : "Texto")));
          var ti = (cp.t === "body" || cp.t === "caption") ? el("textarea", "in") : el("input", "in"); ti.value = cp[tf] || ""; lf.appendChild(ti);
          var cnt = el("div", "cnt", (cp[tf] || "").length + " / " + lim + " caracteres"); if ((cp[tf] || "").length > lim) cnt.classList.add("over"); lf.appendChild(cnt); right.appendChild(lf);
          st.ui = { ti: ti, cnt: cnt, lim: lim, tf: tf };
          ti.oninput = function () { cp[tf] = ti.value; var tn = st.textNodes[st.scr + "_" + st.sel]; if (tn) tn.textContent = ti.value; updCounter(); renderValidationOnly(); };
        }
        if (cp.t === "image") { var f = el("div", "field"); f.appendChild(el("label", null, "Arquivo (JPEG/PNG, ≤300KB)")); var fileIn = document.createElement("input"); fileIn.type = "file"; fileIn.accept = "image/png,image/jpeg"; fileIn.className = "in"; fileIn.onchange = function () { var file = fileIn.files[0]; if (!file) return; if (file.size > 300 * 1024) { alert("Imagem acima de 300KB."); return; } var rd = new FileReader(); rd.onload = function () { cp.src = rd.result; renderStage(); }; rd.readAsDataURL(file); }; f.appendChild(fileIn); right.appendChild(f); var fa = el("div", "field"); fa.appendChild(el("label", null, "Texto alternativo")); var ai = inp("descrição", cp.alt); ai.oninput = function () { cp.alt = ai.value; }; fa.appendChild(ai); right.appendChild(fa); }
        if (isInput(cp.t)) { var fn = el("div", "field"); fn.appendChild(el("label", null, "name (identificador)")); var ni = inp("name", cp.name); ni.oninput = function () { cp.name = ni.value.replace(/[^a-zA-Z0-9_]/g, "_"); renderValidationOnly(); }; fn.appendChild(ni); right.appendChild(fn); var tg = el("label", "toggle"); var ck = document.createElement("input"); ck.type = "checkbox"; ck.checked = !!cp.required; ck.onchange = function () { cp.required = ck.checked; }; tg.appendChild(ck); tg.appendChild(document.createTextNode("Obrigatório")); right.appendChild(tg); }
        if (cp.t === "input") { var fi = el("div", "field"); fi.appendChild(el("label", null, "Tipo")); var ts = selOf(["text", "email", "number", "phone", "password", "passcode"], function (v) { return v; }, function (v) { return v; }); ts.value = cp.inputType || "text"; ts.onchange = function () { cp.inputType = ts.value; }; fi.appendChild(ts); right.appendChild(fi); }
        if (cp.t === "input" || cp.t === "textarea" || cp.t === "date") { var fh = el("div", "field"); fh.appendChild(el("label", null, "Texto de ajuda (máx 80)")); var hi = inp("ajuda", cp.helper); hi.oninput = function () { cp.helper = hi.value; renderStage(); renderValidationOnly(); }; fh.appendChild(hi); right.appendChild(fh); }
        if (cp.t === "dropdown" || cp.t === "radio" || cp.t === "checkbox") { right.appendChild(el("label", null, "Opções")); (cp.options || []).forEach(function (op, i) { var row = el("div", "opt-edit"); var oi = inp("opção", op); oi.oninput = function () { cp.options[i] = oi.value; renderStage(); }; row.appendChild(oi); var x = el("button", "btn danger", "✕"); x.onclick = function () { cp.options.splice(i, 1); renderAll(); }; row.appendChild(x); right.appendChild(row); }); var addo = el("button", "btn sm ghost", "+ opção"); addo.onclick = function () { cp.options.push("Nova opção"); renderAll(); }; right.appendChild(addo); }
        if (cp.t === "link") {
          var fa2 = el("div", "field"); fa2.appendChild(el("label", null, "Ação ao tocar"));
          var as = selOf([["navigate", "Ir para uma tela"], ["open_url", "Abrir um link (URL)"]], function (v) { return v[0]; }, function (v) { return v[1]; }); as.value = cp.action || "navigate"; fa2.appendChild(as); right.appendChild(fa2);
          var holder = el("div"); right.appendChild(holder);
          var renderAct = function () {
            holder.textContent = "";
            if ((cp.action || "navigate") === "navigate") { var ff = el("div", "field"); ff.appendChild(el("label", null, "Tela de destino")); var ss = selOf(st.model.screens.map(function (s, i) { return { id: s.id, label: s.title || ("Tela " + (i + 1)) }; }), function (v) { return v.id; }, function (v) { return v.label; }); ss.value = cp.target || ""; ss.onchange = function () { cp.target = ss.value; renderValidationOnly(); }; ff.appendChild(ss); holder.appendChild(ff); }
            else { var fu = el("div", "field"); fu.appendChild(el("label", null, "URL")); var ui = inp("https://...", cp.url); ui.oninput = function () { cp.url = ui.value; renderValidationOnly(); }; fu.appendChild(ui); holder.appendChild(fu); }
          };
          as.onchange = function () { cp.action = as.value; renderAct(); renderValidationOnly(); }; renderAct();
        }
        var rm = el("button", "btn danger", "remover elemento"); rm.style.marginTop = "14px"; rm.onclick = function () { screen().components.splice(st.sel, 1); st.sel = -1; renderAll(); }; right.appendChild(rm);
      }
      var vh = el("h4", null, "Validação"); vh.style.marginTop = "16px"; right.appendChild(vh); valBox = el("div", "valbox"); right.appendChild(valBox); renderValidationOnly();
    }

    function lineOfError(text, e) { var m = /position (\\d+)/.exec(e.message || ""); if (!m) return -1; return text.slice(0, Number(m[1])).split("\\n").length - 1; }
    function compAtLine(line) { var r = (st.jsonRanges || []).filter(function (x) { return line >= x.start && line <= x.end; })[0]; return r ? r.idx : -1; }
    function highlightJsonLines(idx) { if (!st.jsonLines) return; var lns = st.jsonLines.querySelectorAll(".ln"); for (var i = 0; i < lns.length; i++) lns[i].classList.remove("hl"); var r = (st.jsonRanges || []).filter(function (x) { return x.idx === idx; })[0]; if (!r) return; for (var j = r.start; j <= r.end && j < lns.length; j++) lns[j].classList.add("hl"); }
    function rebuildJsonRanges() { st.jsonRanges = screenJsonWithRanges(displayScreen(screen())).ranges; }
    function renderJson() {
      right.textContent = ""; right.appendChild(el("h4", null, "JSON da tela (editável)"));
      var jr = screenJsonWithRanges(displayScreen(screen())); st.jsonRanges = jr.ranges;
      var wrap = el("div", "jsonwrap"); var jl = el("pre", "jl"); st.jsonLines = jl;
      function buildLines(text, errLine) { jl.textContent = ""; text.split("\\n").forEach(function (line, i) { var d = el("div", "ln"); d.textContent = line || " "; if (errLine === i) d.classList.add("err"); jl.appendChild(d); }); }
      buildLines(jr.text, -1);
      var tx = el("textarea", "jt"); tx.value = jr.text; tx.spellcheck = false; st.jsonTextarea = tx; wrap.appendChild(jl); wrap.appendChild(tx); right.appendChild(wrap);
      var errEl = el("div", "jerr"); right.appendChild(errEl);
      tx.onscroll = function () { jl.style.transform = "translateY(" + (-tx.scrollTop) + "px)"; };
      tx.oninput = function () {
        var parsed; try { parsed = JSON.parse(tx.value); } catch (e) { wrap.classList.add("bad"); var ln = lineOfError(tx.value, e); buildLines(tx.value, ln); errEl.textContent = "JSON inválido" + (ln >= 0 ? " (linha " + (ln + 1) + ")" : "") + ": " + e.message; return; }
        wrap.classList.remove("bad"); errEl.textContent = "";
        if (parsed && parsed.components) {
          var origImgs = (screen().components || []).filter(function (x) { return x.t === "image"; }).map(function (x) { return x.src; });
          var ki = 0;
          parsed.components.forEach(function (cp) { if (cp && cp.t === "image") { if (typeof cp.src === "string" && cp.src.indexOf("…") >= 0) cp.src = origImgs[ki] || ""; ki++; } });
          st.model.screens[st.scr] = { id: parsed.id || screen().id, title: parsed.title || "", variables: parsed.variables || [], components: parsed.components }; renderStage(); renderLeft();
        }
        rebuildJsonRanges(); buildLines(tx.value, -1); if (st.sel >= 0) highlightJsonLines(st.sel);
      };
      tx.onkeyup = tx.onclick = function () { var line = tx.value.slice(0, tx.selectionStart).split("\\n").length - 1; var idx = compAtLine(line); if (idx >= 0 && idx !== st.sel) { st.sel = idx; markSel(); } };
      if (st.sel >= 0) highlightJsonLines(st.sel);
    }

    function renderAll() { renderLeft(); renderStage(); renderRight(); }
    jsonBtn.onclick = function () { st.jsonMode = !st.jsonMode; jsonBtn.textContent = st.jsonMode ? "Ver por item" : "Ver JSON"; renderRight(); };
    save.onclick = async function () {
      if (!st.name.trim()) { smsg.textContent = "Dê um nome ao flow."; smsg.className = "msg error"; return; }
      var errs = validate(st.model).filter(function (e) { return e.k === "err"; }); if (errs.length) { smsg.textContent = "Corrija os erros antes de salvar: " + errs[0].m; smsg.className = "msg error"; return; }
      var payload = { name: st.name.trim(), flow_json: { builder: st.model, flow: exportFlow(st.model) } };
      var path = st.id ? "/api/products/" + p.id + "/flows/" + st.id : "/api/products/" + p.id + "/flows";
      var r = await api(path, payload); if (r.ok) { smsg.textContent = "Flow salvo."; smsg.className = "msg ok"; if (!st.id && r.data.id) st.id = r.data.id; } else { smsg.textContent = (r.data && r.data.error) || "Erro ao salvar."; smsg.className = "msg error"; }
    };
    renderAll();
  }

  window.addEventListener("message", function (e) { var d = e.data || {}; if (d.type === "garagem:resize" && d.height) { var frames = document.getElementsByClassName("screen-frame"); for (var i = 0; i < frames.length; i++) { if (frames[i].contentWindow === e.source) frames[i].style.height = (d.height + 8) + "px"; } } });
  (async function () { var res = await fetch("/auth/me", { credentials: "same-origin" }); if (res.ok) { var data = await res.json(); $("user-email").textContent = data.email; showApp(); } })();
</script>
</body>
</html>`;
