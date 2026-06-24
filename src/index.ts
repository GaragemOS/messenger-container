// Entrypoint da aplicacao: aplica migrations pendentes e sobe o servidor HTTP.
import { config } from "./config/index.ts";
import { runMigrations } from "./db/migrate.ts";
import { buildServer } from "./http/server.ts";
import { pool } from "./db/pool.ts";

async function main(): Promise<void> {
  const ran = await runMigrations();
  if (ran.length) {
    console.log(`Migrations aplicadas no boot: ${ran.join(", ")}`);
  }

  const app = buildServer();
  await app.listen({ host: "0.0.0.0", port: config.port });
}

main().catch(async (err) => {
  console.error("Falha ao iniciar a aplicacao:", err);
  await pool.end().catch(() => {});
  process.exit(1);
});
