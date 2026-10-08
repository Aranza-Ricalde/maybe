import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida (ver .env.example)");
}

const MAX_CONNECTIONS = 5;

const globalForDb = globalThis as unknown as { maybePool?: Pool };

const pool = globalForDb.maybePool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: MAX_CONNECTIONS });

pool.on("error", () => undefined);

if (process.env.NODE_ENV !== "production") globalForDb.maybePool = pool;

export const db = drizzle(pool, { schema });
