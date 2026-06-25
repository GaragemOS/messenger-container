// Pagina do console interno (HTML servido pela central). Frontend sem comentarios
// por convencao; toda a logica de fluxo e do dashboard vive no script inline.
export const CONSOLE_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Garagem · Console</title>
<style>
  :root {
    --primary: #4F46E5;
    --on-primary: #fff;
    --surface: #FBFAFF;
    --surface-container: #fff;
    --on-surface: #1B1B21;
    --on-surface-variant: #5A5A66;
    --outline: #E2E1E8;
    --primary-container: #E5E0FF;
    --error: #BA1A1A;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; padding: 24px 16px;
    background: var(--surface); color: var(--on-surface);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .card {
    margin: auto; width: min(92vw, 420px); background: var(--surface-container);
    border-radius: 28px; padding: 32px 28px;
    box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08);
  }
  .dashboard { margin: auto; width: min(96vw, 1080px); }
  .brand { font-weight: 700; letter-spacing: .5px; color: var(--primary); margin: 0 0 4px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  p.sub { color: var(--on-surface-variant); margin: 0 0 24px; font-size: 14px; }
  label { display: block; font-size: 13px; color: var(--on-surface-variant); margin: 16px 0 6px; }
  input {
    width: 100%; padding: 14px 16px; font-size: 16px; color: var(--on-surface);
    border: 1px solid var(--outline); border-radius: 14px; background: transparent; outline: none;
  }
  input:focus { border-color: var(--primary); border-width: 2px; padding: 13px 15px; }
  button {
    width: 100%; margin-top: 24px; padding: 14px 24px; font-size: 15px; font-weight: 600;
    color: var(--on-primary); background: var(--primary); border: 0; border-radius: 999px; cursor: pointer;
  }
  button:hover { filter: brightness(1.08); }
  button:disabled { opacity: .55; cursor: default; }
  .link { background: none; color: var(--primary); width: auto; margin: 16px auto 0; display: block; padding: 8px; font-size: 14px; }
  .msg { margin-top: 12px; font-size: 14px; min-height: 18px; }
  .msg.error { color: var(--error); }
  .msg.ok { color: #1f7a3d; }
  .hidden { display: none; }
  .muted { color: var(--on-surface-variant); font-size: 13px; }
  .empty { color: var(--on-surface-variant); font-size: 14px; }

  .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .btn-text { background: none; color: var(--primary); width: auto; margin: 0; padding: 8px 12px; font-size: 14px; }
  .btn-sm { width: auto; margin: 0; padding: 9px 16px; font-size: 13px; }
  .dash { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
  @media (max-width: 780px) { .dash { grid-template-columns: 1fr; } }
  .panel { background: var(--surface-container); border: 1px solid var(--outline); border-radius: 20px; padding: 20px; }
  .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .panel-head h2 { font-size: 16px; margin: 0; }
  .form-inline { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .form-inline input { padding: 10px 12px; font-size: 14px; }
  .prod-row { padding: 12px; border-radius: 12px; cursor: pointer; border: 1px solid transparent; }
  .prod-row:hover { background: var(--surface); }
  .prod-row.active { border-color: var(--primary); background: var(--primary-container); }
  .prod-row .pname { font-weight: 600; }
  .prod-row .pslug { font-size: 12px; color: var(--on-surface-variant); }
  .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: .5px; color: var(--on-surface-variant); margin: 18px 0 8px; }
  .key-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--outline); font-size: 13px; gap: 8px; }
  .key-row:last-child { border-bottom: 0; }
  .key-row code { background: var(--surface); padding: 2px 6px; border-radius: 6px; }
  .tag { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: var(--primary-container); color: var(--primary); }
  .tag.revoked { background: #f5d6d6; color: var(--error); }
  .revoke { background: none; color: var(--error); width: auto; margin: 0; padding: 4px 8px; font-size: 12px; }
  .reveal { background: #0f1f12; color: #cde9d2; padding: 14px; border-radius: 12px; font-family: ui-monospace, monospace; font-size: 12px; word-break: break-all; margin: 12px 0; }
  .reveal .warn { color: #ffd27d; display: block; margin-bottom: 6px; font-weight: 600; font-family: system-ui, sans-serif; }
  .tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: 16px 0 12px; border-bottom: 1px solid var(--outline); }
  .tab { width: auto; margin: 0; padding: 8px 14px; font-size: 13px; background: none; color: var(--on-surface-variant); border-radius: 10px 10px 0 0; }
  .tab.active { color: var(--primary); background: var(--primary-container); }
  .tab-body { min-height: 120px; }
  .screen-frame { width: 100%; border: 0; min-height: 240px; display: block; border-radius: 12px; background: var(--surface); }
</style>
</head>
<body>
<main class="card" id="auth-card">
  <p class="brand">GARAGEM</p>

  <section id="view-login">
    <h1>Entrar no console</h1>
    <p class="sub">Acesso restrito a e-mails @garagem.dev.br.</p>
    <label for="login-email">E-mail</label>
    <input id="login-email" type="email" autocomplete="username" placeholder="voce@garagem.dev.br" />
    <label for="login-password">Senha</label>
    <input id="login-password" type="password" autocomplete="current-password" />
    <button id="btn-login">Entrar</button>
    <button class="link" id="to-request">Primeiro acesso? Definir senha</button>
    <div class="msg" id="login-msg"></div>
  </section>

  <section id="view-request" class="hidden">
    <h1>Primeiro acesso</h1>
    <p class="sub">Enviaremos um código de confirmação para o seu e-mail.</p>
    <label for="req-email">E-mail</label>
    <input id="req-email" type="email" autocomplete="username" placeholder="voce@garagem.dev.br" />
    <button id="btn-request">Enviar código</button>
    <button class="link" id="to-login-1">Já tenho senha</button>
    <div class="msg" id="request-msg"></div>
  </section>

  <section id="view-setpass" class="hidden">
    <h1>Definir senha</h1>
    <p class="sub">Informe o código recebido e crie sua senha (mínimo 10 caracteres).</p>
    <label for="set-code">Código</label>
    <input id="set-code" inputmode="numeric" placeholder="000000" />
    <label for="set-password">Nova senha</label>
    <input id="set-password" type="password" autocomplete="new-password" />
    <button id="btn-setpass">Definir senha</button>
    <button class="link" id="to-login-2">Voltar</button>
    <div class="msg" id="setpass-msg"></div>
  </section>
</main>

<main class="dashboard hidden" id="dash-root">
  <div class="topbar">
    <p class="brand">GARAGEM · Console</p>
    <div class="topbar-right">
      <span class="muted" id="authed-email"></span>
      <button class="btn-text" id="btn-logout">Sair</button>
    </div>
  </div>
  <div class="dash">
    <div class="panel">
      <div class="panel-head">
        <h2>Produtos</h2>
        <button class="btn-sm" id="btn-new-product">+ Novo</button>
      </div>
      <div id="new-product-form" class="form-inline hidden">
        <input id="np-name" placeholder="Nome do produto" />
        <input id="np-slug" placeholder="slug-do-produto" />
        <input id="np-origins" placeholder="origens permitidas (vírgula)" />
        <button class="btn-sm" id="btn-create-product">Criar produto</button>
        <div class="msg" id="np-msg"></div>
      </div>
      <div id="product-list"><p class="empty">Carregando...</p></div>
    </div>
    <div class="panel">
      <div id="product-detail"><p class="empty">Selecione um produto para ver as chaves e telas.</p></div>
    </div>
  </div>
</main>

<script>
  var $ = function (id) { return document.getElementById(id); };
  var setEmail = "";
  var selected = null;

  function msg(id, text, kind) { var el = $(id); el.textContent = text || ""; el.className = "msg" + (kind ? " " + kind : ""); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  async function api(path, body) {
    var res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body || {}) });
    var data = {}; try { data = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, data: data };
  }
  async function apiGet(path) {
    var res = await fetch(path, { credentials: "same-origin" });
    var data = {}; try { data = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, data: data };
  }

  function showAuth(view) {
    $("auth-card").classList.remove("hidden");
    $("dash-root").classList.add("hidden");
    ["login", "request", "setpass"].forEach(function (v) { $("view-" + v).classList.toggle("hidden", v !== view); });
  }
  function showDash() {
    $("auth-card").classList.add("hidden");
    $("dash-root").classList.remove("hidden");
    loadProducts();
  }

  $("to-request").onclick = function () { showAuth("request"); };
  $("to-login-1").onclick = function () { showAuth("login"); };
  $("to-login-2").onclick = function () { showAuth("login"); };

  $("btn-request").onclick = async function () {
    var email = $("req-email").value.trim();
    $("btn-request").disabled = true; msg("request-msg", "Enviando...", "");
    await api("/auth/request-code", { email: email });
    $("btn-request").disabled = false; setEmail = email;
    msg("setpass-msg", "Se o e-mail for válido, o código foi enviado.", "ok"); showAuth("setpass");
  };
  $("btn-setpass").onclick = async function () {
    var r = await api("/auth/set-password", { email: setEmail, code: $("set-code").value.trim(), password: $("set-password").value });
    if (r.ok) { msg("login-msg", "Senha definida. Faça login.", "ok"); showAuth("login"); $("login-email").value = setEmail; }
    else { msg("setpass-msg", (r.data && r.data.error) || "Erro ao definir senha.", "error"); }
  };
  $("btn-login").onclick = async function () {
    var email = $("login-email").value.trim();
    $("btn-login").disabled = true; msg("login-msg", "Entrando...", "");
    var r = await api("/auth/login", { email: email, password: $("login-password").value });
    $("btn-login").disabled = false;
    if (r.ok) { $("authed-email").textContent = (r.data && r.data.email) || email; showDash(); }
    else { msg("login-msg", (r.data && r.data.error) || "Credenciais inválidas.", "error"); }
  };
  $("btn-logout").onclick = async function () { await api("/auth/logout", {}); selected = null; showAuth("login"); };

  $("btn-new-product").onclick = function () { $("new-product-form").classList.toggle("hidden"); };
  $("btn-create-product").onclick = async function () {
    var origins = $("np-origins").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var r = await api("/api/products", { name: $("np-name").value.trim(), slug: $("np-slug").value.trim(), allowed_origins: origins });
    if (r.ok) { $("np-name").value = ""; $("np-slug").value = ""; $("np-origins").value = ""; $("new-product-form").classList.add("hidden"); loadProducts(); }
    else { msg("np-msg", (r.data && r.data.error) || "Erro ao criar.", "error"); }
  };

  async function loadProducts() {
    var r = await apiGet("/api/products");
    var list = $("product-list"); list.textContent = "";
    var products = (r.data && r.data.products) || [];
    if (!products.length) { list.appendChild(el("p", "empty", "Nenhum produto ainda. Crie o primeiro.")); return; }
    products.forEach(function (p) {
      var row = el("div", "prod-row" + (selected === p.id ? " active" : ""));
      row.appendChild(el("div", "pname", p.name));
      row.appendChild(el("div", "pslug", p.slug));
      row.onclick = function () { selected = p.id; loadProducts(); selectProduct(p); };
      list.appendChild(row);
    });
  }

  function selectProduct(p) {
    var d = $("product-detail"); d.textContent = "";
    d.appendChild(el("h2", null, p.name));
    d.appendChild(el("p", "muted", p.slug + (p.allowed_origins && p.allowed_origins.length ? " · origens: " + p.allowed_origins.join(", ") : "")));

    var tabs = el("div", "tabs");
    var body = el("div", "tab-body");
    var defs = [["keys", "Chaves"], ["multitenant", "Multitenant"], ["templates", "Templates"], ["flows", "Flows"], ["metrics", "Métricas"]];
    defs.forEach(function (t) {
      var b = el("button", "tab", t[1]);
      b.onclick = function () {
        Array.prototype.forEach.call(tabs.children, function (c) { c.classList.remove("active"); });
        b.classList.add("active");
        renderTab(p, t[0], body);
      };
      tabs.appendChild(b);
    });
    d.appendChild(tabs); d.appendChild(body);
    tabs.children[0].classList.add("active");
    renderTab(p, "keys", body);
  }

  function renderTab(p, tab, body) {
    body.textContent = "";
    if (tab === "keys") {
      var box = el("div"); box.id = "keys-box"; body.appendChild(box);
      var genBtn = el("button", "btn-sm", "Gerar nova chave"); genBtn.style.marginTop = "12px";
      genBtn.onclick = function () { createKey(p.id); };
      body.appendChild(genBtn);
      var rb = el("div"); rb.id = "reveal-box"; body.appendChild(rb);
      loadKeys(p.id);
      return;
    }
    body.appendChild(el("p", "empty", "Carregando tela..."));
    api("/api/products/" + p.id + "/embed-token", { class: tab }).then(function (r) {
      body.textContent = "";
      if (!r.ok || !r.data.embed_token) { body.appendChild(el("p", "empty", "Não foi possível carregar a tela.")); return; }
      var f = document.createElement("iframe");
      f.className = "screen-frame";
      f.src = "/v1/screen/" + tab + "?t=" + encodeURIComponent(r.data.embed_token);
      body.appendChild(f);
    });
  }

  async function loadKeys(id) {
    var r = await apiGet("/api/products/" + id + "/keys");
    var box = $("keys-box"); if (!box) return; box.textContent = "";
    var keys = (r.data && r.data.keys) || [];
    if (!keys.length) { box.appendChild(el("p", "empty", "Nenhuma chave gerada.")); return; }
    keys.forEach(function (k) {
      var row = el("div", "key-row");
      var left = el("div");
      var code = el("code", null, k.key_id + "…" + k.last_four); left.appendChild(code);
      row.appendChild(left);
      var right = el("div"); right.style.display = "flex"; right.style.alignItems = "center"; right.style.gap = "8px";
      right.appendChild(el("span", "tag" + (k.status === "revoked" ? " revoked" : ""), k.status));
      if (k.status === "active") {
        var rev = el("button", "revoke", "revogar");
        rev.onclick = function () { revokeKey(id, k.id); };
        right.appendChild(rev);
      }
      row.appendChild(right);
      box.appendChild(row);
    });
  }

  async function createKey(id) {
    var r = await api("/api/products/" + id + "/keys", {});
    var rb = $("reveal-box"); if (!rb) return;
    if (r.ok && r.data.key) {
      rb.textContent = "";
      var box = el("div", "reveal");
      box.appendChild(el("span", "warn", "Copie agora — esta chave não será exibida novamente."));
      box.appendChild(document.createTextNode(r.data.key));
      rb.appendChild(box);
      loadKeys(id);
    }
  }

  async function revokeKey(productId, keyId) {
    await api("/api/keys/" + keyId + "/revoke", {});
    loadKeys(productId);
  }

  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "garagem:resize" && d.height) {
      var frames = document.getElementsByClassName("screen-frame");
      for (var i = 0; i < frames.length; i++) {
        if (frames[i].contentWindow === e.source) frames[i].style.height = (d.height + 8) + "px";
      }
    }
  });

  (async function () {
    var res = await fetch("/auth/me", { credentials: "same-origin" });
    if (res.ok) { var data = await res.json(); $("authed-email").textContent = data.email; showDash(); }
  })();
</script>
</body>
</html>`;
