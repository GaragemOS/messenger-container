// Pagina do console interno (HTML servido pela central). Frontend sem comentarios
// por convencao; toda a logica de fluxo vive no script inline abaixo.
export const CONSOLE_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Garagem · Console</title>
<style>
  :root {
    --primary: #4F46E5;
    --on-primary: #ffffff;
    --surface: #FBFAFF;
    --surface-container: #ffffff;
    --on-surface: #1B1B21;
    --on-surface-variant: #5A5A66;
    --outline: #C8C6D0;
    --error: #BA1A1A;
    --radius-card: 28px;
    --radius-field: 14px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: var(--surface); color: var(--on-surface);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .card {
    width: min(92vw, 420px); background: var(--surface-container);
    border-radius: var(--radius-card); padding: 32px 28px;
    box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08);
  }
  .brand { font-weight: 700; letter-spacing: .5px; color: var(--primary); margin: 0 0 4px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  p.sub { color: var(--on-surface-variant); margin: 0 0 24px; font-size: 14px; }
  label { display: block; font-size: 13px; color: var(--on-surface-variant); margin: 16px 0 6px; }
  input {
    width: 100%; padding: 14px 16px; font-size: 16px; color: var(--on-surface);
    border: 1px solid var(--outline); border-radius: var(--radius-field);
    background: transparent; outline: none;
  }
  input:focus { border-color: var(--primary); border-width: 2px; padding: 13px 15px; }
  button {
    width: 100%; margin-top: 24px; padding: 14px 24px; font-size: 15px; font-weight: 600;
    color: var(--on-primary); background: var(--primary); border: 0; border-radius: 999px;
    cursor: pointer; transition: filter .15s;
  }
  button:hover { filter: brightness(1.08); }
  button:disabled { opacity: .55; cursor: default; }
  .link { background: none; color: var(--primary); width: auto; margin: 16px auto 0;
    display: block; padding: 8px; font-size: 14px; }
  .msg { margin-top: 16px; font-size: 14px; min-height: 20px; }
  .msg.error { color: var(--error); }
  .msg.ok { color: #1f7a3d; }
  .hidden { display: none; }
  .authed { text-align: center; }
  .authed .email { font-weight: 600; }
</style>
</head>
<body>
<main class="card">
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

  <section id="view-authed" class="hidden authed">
    <h1>Console</h1>
    <p class="sub">Você está autenticado.</p>
    <p>Logado como <span class="email" id="authed-email"></span></p>
    <button id="btn-logout">Sair</button>
  </section>
</main>

<script>
  const $ = (id) => document.getElementById(id);
  const views = ["login", "request", "setpass", "authed"];
  let setEmail = "";

  function show(view) {
    for (const v of views) $("view-" + v).classList.toggle("hidden", v !== view);
  }
  function msg(id, text, kind) {
    const el = $(id);
    el.textContent = text || "";
    el.className = "msg" + (kind ? " " + kind : "");
  }
  async function api(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, data };
  }

  $("to-request").onclick = () => { show("request"); };
  $("to-login-1").onclick = () => { show("login"); };
  $("to-login-2").onclick = () => { show("login"); };

  $("btn-request").onclick = async () => {
    const email = $("req-email").value.trim();
    $("btn-request").disabled = true;
    msg("request-msg", "Enviando...", "");
    await api("/auth/request-code", { email });
    $("btn-request").disabled = false;
    setEmail = email;
    msg("setpass-msg", "Se o e-mail for válido, o código foi enviado.", "ok");
    show("setpass");
  };

  $("btn-setpass").onclick = async () => {
    const code = $("set-code").value.trim();
    const password = $("set-password").value;
    $("btn-setpass").disabled = true;
    msg("setpass-msg", "Validando...", "");
    const r = await api("/auth/set-password", { email: setEmail, code, password });
    $("btn-setpass").disabled = false;
    if (r.ok) {
      msg("login-msg", "Senha definida. Faça login.", "ok");
      show("login");
      $("login-email").value = setEmail;
    } else {
      msg("setpass-msg", (r.data && r.data.error) || "Erro ao definir senha.", "error");
    }
  };

  $("btn-login").onclick = async () => {
    const email = $("login-email").value.trim();
    const password = $("login-password").value;
    $("btn-login").disabled = true;
    msg("login-msg", "Entrando...", "");
    const r = await api("/auth/login", { email, password });
    $("btn-login").disabled = false;
    if (r.ok) {
      $("authed-email").textContent = (r.data && r.data.email) || email;
      show("authed");
    } else {
      msg("login-msg", (r.data && r.data.error) || "Credenciais inválidas.", "error");
    }
  };

  $("btn-logout").onclick = async () => {
    await api("/auth/logout", {});
    show("login");
  };

  (async () => {
    const res = await fetch("/auth/me", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json();
      $("authed-email").textContent = data.email;
      show("authed");
    }
  })();
</script>
</body>
</html>`;
