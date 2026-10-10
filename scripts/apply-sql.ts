import { readFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";

const E2E_HOST_FRAGMENT = "ep-frosty-boat-b45l6qth";

function parseArguments(argv: string[]): { files: string[]; query: string | null } {
  const queryIndex = argv.indexOf("--query");
  const query = queryIndex >= 0 ? (argv[queryIndex + 1] ?? null) : null;
  const files = argv.filter((argument, index) => argument.endsWith(".sql") && (queryIndex < 0 || index !== queryIndex + 1));
  return { files, query };
}

async function main() {
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL no está definida");
  const { files, query } = parseArguments(process.argv.slice(2));
  if (files.length === 0 && !query) throw new Error("Uso: tsx scripts/apply-sql.ts <archivo.sql ...> [--query \"select ...\"]");

  const target = url.includes(E2E_HOST_FRAGMENT) ? "branch e2e-tests" : "base de datos configurada en DATABASE_URL";
  console.log(`Destino: ${target}`);

  const pool = new Pool({ connectionString: url });
  try {
    for (const file of files) {
      await pool.query(readFileSync(file, "utf8"));
      console.log(`Aplicado: ${file}`);
    }
    if (query) {
      const result = await pool.query(query);
      console.log(JSON.stringify(result.rows, null, 2));
    }
  } finally {
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
