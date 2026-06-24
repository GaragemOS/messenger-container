// Rotas de autenticacao do console interno.
// Fluxo: request-code (e-mail) -> set-password (codigo) -> login (senha) ->
// sessao por cookie. Restrito a e-mails do dominio permitido.
import type { FastifyInstance } from "fastify";
import { config } from "../../config/index.ts";
import { isAllowedDomain, normalizeEmail } from "../../auth/domain.ts";
import { generateCode, hashCode, verifyCode } from "../../auth/codes.ts";
import { hashPassword, verifyPassword, needsRehash } from "../../auth/password.ts";
import { generateSessionToken, hashSessionToken } from "../../auth/session.ts";
import * as users from "../../auth/users.repo.ts";
import * as codes from "../../auth/codes.repo.ts";
import * as sessions from "../../auth/sessions.repo.ts";
import { checkRateLimit } from "../../auth/ratelimit.ts";
import { sendEmail, verificationEmail } from "../../email/resend.ts";
import { readSessionCookie, serializeSessionCookie, clearSessionCookie } from "../cookies.ts";

const SESSION_TTL_DAYS = 7;
const MIN_PASSWORD_LEN = 10;

// Hash dummy (calculado uma vez) para manter o tempo de verificacao uniforme
// quando o usuario nao existe, evitando enumeracao por timing.
const dummyHashPromise = hashPassword("dummy-password-for-uniform-timing");

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Solicitar codigo. Resposta sempre generica (anti-enumeracao).
  app.post("/auth/request-code", async (req) => {
    const { email: rawEmail } = (req.body ?? {}) as { email?: string };
    const email = normalizeEmail(rawEmail ?? "");
    if (isAllowedDomain(email, config.auth.allowedDomains)) {
      const ipOk = await checkRateLimit(`reqcode:ip:${req.ip}`, 10, 3600);
      const emailOk = await checkRateLimit(`reqcode:email:${email}`, 3, 3600);
      if (ipOk && emailOk) {
        await users.upsertPendingUser(email);
        const code = generateCode(6);
        await codes.storeCode(email, hashCode(code, config.auth.pepper), "signup", 10);
        const mail = verificationEmail(code);
        try {
          await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
        } catch (err) {
          req.log.error({ err }, "falha ao enviar e-mail de codigo");
        }
      }
    }
    return { ok: true };
  });

  // Definir senha com o codigo recebido.
  app.post("/auth/set-password", async (req, reply) => {
    const { email: rawEmail, code, password } = (req.body ?? {}) as {
      email?: string;
      code?: string;
      password?: string;
    };
    const email = normalizeEmail(rawEmail ?? "");
    const pass = password ?? "";
    if (!isAllowedDomain(email, config.auth.allowedDomains) || pass.length < MIN_PASSWORD_LEN) {
      reply.code(400);
      return { error: `dados invalidos (senha minima de ${MIN_PASSWORD_LEN} caracteres)` };
    }
    const active = await codes.findActiveCode(email, "signup");
    if (!active || active.attempts >= 5 || !verifyCode((code ?? "").trim(), config.auth.pepper, active.code_hash)) {
      if (active) await codes.incrementAttempts(active.id);
      reply.code(400);
      return { error: "codigo invalido ou expirado" };
    }
    await codes.consumeCode(active.id);
    await users.setUserPassword(email, await hashPassword(pass));
    return { ok: true };
  });

  // Login com e-mail e senha.
  app.post("/auth/login", async (req, reply) => {
    const { email: rawEmail, password } = (req.body ?? {}) as { email?: string; password?: string };
    const email = normalizeEmail(rawEmail ?? "");
    const pass = password ?? "";
    const ipOk = await checkRateLimit(`login:ip:${req.ip}`, 30, 900);
    const user = await users.findUserByEmail(email);
    const hash = user?.password_hash ?? (await dummyHashPromise);
    const passOk = await verifyPassword(hash, pass);
    const locked = user?.locked_until != null && new Date(user.locked_until) > new Date();
    if (!ipOk || !user || !user.password_hash || user.status !== "active" || locked || !passOk) {
      if (user && user.password_hash && !passOk) await users.recordLoginFailure(user.id);
      reply.code(401);
      return { error: "credenciais invalidas" };
    }
    await users.recordLoginSuccess(user.id);
    if (needsRehash(user.password_hash)) {
      await users.setUserPassword(email, await hashPassword(pass));
    }
    const token = generateSessionToken();
    await sessions.createSession(
      user.id,
      hashSessionToken(token),
      req.ip,
      req.headers["user-agent"] ?? null,
      SESSION_TTL_DAYS,
    );
    reply.header("set-cookie", serializeSessionCookie(token, SESSION_TTL_DAYS * 24 * 3600));
    return { ok: true, email: user.email };
  });

  // Logout: revoga a sessao e limpa o cookie.
  app.post("/auth/logout", async (req, reply) => {
    const token = readSessionCookie(req.headers.cookie);
    if (token) await sessions.revokeSession(hashSessionToken(token));
    reply.header("set-cookie", clearSessionCookie());
    return { ok: true };
  });

  // Sessao atual.
  app.get("/auth/me", async (req, reply) => {
    const token = readSessionCookie(req.headers.cookie);
    const su = token ? await sessions.findSessionUser(hashSessionToken(token)) : null;
    if (!su) {
      reply.code(401);
      return { error: "nao autenticado" };
    }
    return { email: su.email };
  });
}
