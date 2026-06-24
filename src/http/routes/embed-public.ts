// Rotas publicas do embed: loader, documento da tela (iframe) e contexto.
// O documento da tela valida o token para definir o frame-ancestors do produto.
import type { FastifyInstance } from "fastify";
import { config } from "../../config/index.ts";
import { LOADER_JS } from "../../embed/loader.ts";
import { screenShellHtml } from "../../embed/screens.ts";
import { verifyEmbedToken } from "../../embed/token.ts";
import { loadPublicKey } from "../../embed/token-keys.ts";
import { getProduct } from "../../apikeys/products.repo.ts";
import { requireEmbedToken } from "../middleware/embed-token.ts";

const CLASSES = ["templates", "flows", "metrics", "multitenant"];

export async function embedPublicRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/loader.js", async (_req, reply) => {
    reply.type("text/javascript; charset=utf-8").header("cache-control", "public, max-age=300");
    return LOADER_JS.replace("__EMBED_ORIGIN__", config.embedBaseUrl);
  });

  app.get("/v1/screen/:class", async (req, reply) => {
    const cls = (req.params as { class: string }).class;
    if (!CLASSES.includes(cls)) {
      reply.code(404).type("text/plain; charset=utf-8");
      return "classe desconhecida";
    }
    const token = (req.query as { t?: string }).t ?? "";
    let origins: string[] = [];
    let valid = false;
    if (token) {
      try {
        const claims = await verifyEmbedToken(await loadPublicKey(), token);
        if (claims.cls === cls) {
          valid = true;
          const product = await getProduct(claims.prd);
          origins = product?.allowed_origins ?? [];
        }
      } catch {
        valid = false;
      }
    }
    const frameAncestors = ["'self'", ...origins].join(" ");
    reply
      .header(
        "content-security-policy",
        "frame-ancestors " + frameAncestors + "; default-src 'self'; img-src 'self' data:; " +
          "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; " +
          "base-uri 'none'; form-action 'none'; object-src 'none'",
      )
      .header("referrer-policy", "no-referrer")
      .header("cache-control", "no-store")
      .header("x-content-type-options", "nosniff")
      .type("text/html; charset=utf-8");
    return screenShellHtml(cls, valid ? token : "");
  });

  app.get("/v1/embed/context", { preHandler: requireEmbedToken }, async (req) => {
    const e = req.embed!;
    return { product: e.product, class: e.cls, scope: e.scope, session: e.session ?? null };
  });

  // Pagina host de demonstracao: /demo?t=<embed_token>&cls=flows
  app.get("/demo", async (req, reply) => {
    const q = req.query as { t?: string; cls?: string };
    const cls = CLASSES.includes(q.cls ?? "") ? (q.cls as string) : "flows";
    reply.type("text/html; charset=utf-8");
    return demoHtml(cls, q.t ?? "");
  });
}

function demoHtml(cls: string, token: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Demo embed Garagem</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;color:#1B1B21}
.host{border:2px dashed #C8C6D0;border-radius:16px;padding:8px;margin-top:16px}
code{background:#F2F0F7;padding:2px 6px;border-radius:6px}</style></head>
<body>
<h1>Demonstracao do embed</h1>
<p>O app terceiro declara apenas <code>&lt;div id="${cls}"&gt;</code> e inclui o loader. A central
renderiza a tela dentro de um iframe isolado, fiel e imutavel.</p>
<div class="host">
  <div id="${cls}" data-embed-token="${token}" data-session="demo"></div>
</div>
<script src="/v1/loader.js" data-embed-token="${token}"></script>
</body></html>`;
}
