import { defineConfig } from "drizzle-kit";

// drizzle-kit (a diferencia de `next dev`) no carga .env.local solo —
// `neon link`/`neon deploy` escriben las credenciales ahí, no en .env.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
    break;
  } catch {
    // el archivo no existe, se intenta el siguiente
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida (ver .env.example)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
