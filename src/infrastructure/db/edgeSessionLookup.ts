import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { sessions } from "./schema/auth";
import { users } from "./schema/core";

export interface EdgeSessionLookupResult {
  tokenHash: string;
  expiresAt: Date;
  user: {
    id: number;
    familyId: number;
    email: string;
    name: string;
  };
}

export async function findSessionWithUserByTokenHashEdge(tokenHash: string): Promise<EdgeSessionLookupResult | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está definida (ver .env.example)");
  }

  const sql = neon(databaseUrl);
  const edgeDb = drizzle(sql, { schema });

  const [row] = await edgeDb
    .select({
      tokenHash: sessions.tokenHash,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      familyId: users.familyId,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (!row) return null;

  return {
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    user: { id: row.userId, familyId: row.familyId, email: row.email, name: row.name },
  };
}
