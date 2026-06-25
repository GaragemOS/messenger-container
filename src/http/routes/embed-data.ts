// Dados consumidos pelas telas do embed (autenticadas pelo embed token).
// Sempre escopadas ao produto do token; multitenant respeita o escopo de empresas.
import type { FastifyInstance } from "fastify";
import { requireEmbedToken } from "../middleware/embed-token.ts";
import * as tenants from "../../tenants/tenants.repo.ts";
import { listTemplates } from "../../templates/templates.repo.ts";
import { listFlows } from "../../flows/flows.repo.ts";

export async function embedDataRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireEmbedToken);

  app.get("/v1/embed/templates", async (req) => ({
    templates: await listTemplates(req.embed!.product),
  }));

  app.get("/v1/embed/flows", async (req) => ({
    flows: await listFlows(req.embed!.product),
  }));

  app.get("/v1/embed/multitenant", async (req) => {
    const scope = req.embed!.scope.client_companies;
    const [companies, numbers] = await Promise.all([
      tenants.listCompanies(req.embed!.product, scope),
      tenants.listNumbers(req.embed!.product, scope),
    ]);
    return { companies, numbers };
  });

  app.get("/v1/embed/metrics", async (req) => ({
    product: req.embed!.product,
    note: "metricas detalhadas chegam na fase 6",
    series: [],
  }));
}
