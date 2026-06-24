// Runner de migration minimalista (sem ORM).
// Aplica, em ordem alfabetica, os arquivos *.sql ainda nao registrados em
// schema_migrations. Cada arquivo roda em sua propria transacao; falha em um
// arquivo aborta apenas aquele arquivo (rollback) e interrompe o processo.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./pool.ts";

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(here, "migrations");

export async function runMigrations(): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const appliedRows = await pool.query<{ version: string }>(
    "SELECT version FROM schema_migrations",
  );
  const applied = new Set(appliedRows.rows.map((r) => r.version));

  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      await client.query("COMMIT");
      ran.push(file);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Falha na migration ${file}: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
  return ran;
}

// Execucao direta via `node --env-file=.env src/db/migrate.ts`.
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
  runMigrations()
    .then(async (ran) => {
      console.log(
        ran.length ? `Migrations aplicadas: ${ran.join(", ")}` : "Nenhuma migration pendente.",
      );
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end().catch(() => {});
      process.exit(1);
    });
}
