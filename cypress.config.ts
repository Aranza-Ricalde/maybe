import { defineConfig } from "cypress";
import { eq, sql } from "drizzle-orm";
import { JoseAccessTokenIssuer, loadAuthSecret } from "./src/infrastructure/auth/accessTokens";
import { db } from "./src/infrastructure/db/client";
import { users } from "./src/infrastructure/db/schema/core";

const WRITE_SQL_PATTERN = /\b(insert|update|delete|truncate|drop|alter|create)\b/i;

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
    supportFile: false,
    setupNodeEvents(on) {
      on("task", {
        async mintAccessToken(familyId: number) {
          const [user] = await db.select().from(users).where(eq(users.familyId, familyId));
          if (!user) throw new Error(`No se encontró un usuario para familyId=${familyId}`);
          const issuer = new JoseAccessTokenIssuer(loadAuthSecret());
          return issuer.sign({ id: user.id, familyId: user.familyId, email: user.email, name: user.name });
        },
        /**
         * SOLO LECTURA — para que los tests verifiquen que lo que muestra la UI coincide con la
         * base real del branch e2e-tests. Nunca usar para mutar datos (usa los casos de uso /
         * flujos de la UI para eso, así el test también valida el flujo real).
         */
        async dbQuery(query: string) {
          if (WRITE_SQL_PATTERN.test(query)) {
            throw new Error("dbQuery es solo de lectura — no se permiten INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER/CREATE.");
          }
          const result = await db.execute(sql.raw(query));
          return result.rows as Record<string, unknown>[];
        },
      });
    },
  },
});
