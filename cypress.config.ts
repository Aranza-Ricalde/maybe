import { defineConfig } from "cypress";
import { eq, like, sql } from "drizzle-orm";
import { JoseAccessTokenIssuer, loadAuthSecret } from "./src/infrastructure/auth/accessTokens";
import { db } from "./src/infrastructure/db/client";
import { DeleteTransactionUseCase } from "./src/application/deleteTransaction";
import { RecordTransactionUseCase } from "./src/application/recordTransaction";
import { shiftMonth } from "./src/domain/dashboard/rules";
import { monthStart } from "./src/domain/ledger/rules";
import { DrizzleLedgerUnitOfWork } from "./src/infrastructure/db/ledger";
import { recurringItems } from "./src/infrastructure/db/schema/budgeting";
import { categories } from "./src/infrastructure/db/schema/classification";
import { users } from "./src/infrastructure/db/schema/core";
import { apiTokens } from "./src/infrastructure/db/schema/security";
import { familySettings } from "./src/infrastructure/db/schema/settings";
import { transactions } from "./src/infrastructure/db/schema/transactions";
import { todayIso } from "./src/lib/today";

const SUBSCRIPTION_CATEGORY = "Suscripciones y streaming";
const SUBSCRIPTION_CHARGES: Array<{ monthsBack: number; name: string; amountCents: number }> = [
  { monthsBack: 3, name: "Microsoft", amountCents: 24_360 },
  { monthsBack: 3, name: "Microsoft", amountCents: 24_360 },
  { monthsBack: 3, name: "Apple", amountCents: 6_950 },
  { monthsBack: 3, name: "Apple", amountCents: 6_950 },
  { monthsBack: 2, name: "Xbox Game Pass", amountCents: 21_900 },
  { monthsBack: 2, name: "Amazon Prime", amountCents: 9_900 },
  { monthsBack: 1, name: "Xbox suscription", amountCents: 21_900 },
  { monthsBack: 1, name: "prime video", amountCents: 9_900 },
];

const WRITE_SQL_PATTERN = /\b(insert|update|delete|truncate|drop|alter|create)\b/i;

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on) {
      on("task", {
        async setPeriodView(view: string) {
          await db.insert(familySettings).values({ familyId: 1, periodView: view }).onConflictDoUpdate({ target: familySettings.familyId, set: { periodView: view } });
          return null;
        },
        cronSecret() {
          return process.env.CRON_SECRET ?? null;
        },
        telegramWebhookSecret() {
          return process.env.TELEGRAM_WEBHOOK_SECRET ?? null;
        },
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
        /**
         * Fixture: los cobros de suscripciones de los últimos 3 meses completos (los mismos del caso real de
         * Xbox y Amazon Prime), creados con los casos de uso. Se limpian con cleanupSubscriptionScenario.
         */
        async seedSubscriptionScenario(accountId: number) {
          const [existing] = await db.select().from(categories).where(eq(categories.name, SUBSCRIPTION_CATEGORY));
          const categoryId = existing?.id ?? (await db.insert(categories).values({ familyId: 1, name: SUBSCRIPTION_CATEGORY, color: "#7c3aed", icon: "tag", classification: "expense" }).returning())[0].id;
          const record = new RecordTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
          const currentMonth = monthStart(todayIso());
          for (const charge of SUBSCRIPTION_CHARGES) {
            const date = `${shiftMonth(currentMonth, -charge.monthsBack).slice(0, 8)}05`;
            await record.execute({ accountId, date, amountCents: -charge.amountCents, name: charge.name, categoryId, source: "manual" }, { skipDuplicateCheck: true });
          }
          return null;
        },
        /** Fixture: una subcategoría bajo una categoría existente (para probar grupos colapsables). */
        async seedChildCategory({ parent, child }: { parent: string; child: string }) {
          const [parentRow] = await db.select().from(categories).where(eq(categories.name, parent));
          if (!parentRow) throw new Error(`No existe la categoría ${parent}`);
          await db.insert(categories).values({ familyId: parentRow.familyId, parentId: parentRow.id, name: child, color: parentRow.color, icon: "tag", classification: parentRow.classification });
          return null;
        },
        async cleanupChildCategory(child: string) {
          await db.delete(categories).where(eq(categories.name, child));
          return null;
        },
        /** Limpia lo que deja la prueba de captura por API: los movimientos con origen "api" y el token. */
        async cleanupApiCapture() {
          const remove = new DeleteTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
          const rows = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.source, "api"));
          for (const row of rows) await remove.execute(row.id);
          await db.delete(apiTokens);
          return null;
        },
        async cleanupPayroll() {
          await db.delete(recurringItems).where(like(recurringItems.name, "Nómina%"));
          return null;
        },
        async cleanupSubscriptionScenario() {
          const remove = new DeleteTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
          const [category] = await db.select().from(categories).where(eq(categories.name, SUBSCRIPTION_CATEGORY));
          if (!category) return null;
          const rows = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.categoryId, category.id));
          for (const row of rows) await remove.execute(row.id);
          await db.delete(categories).where(eq(categories.id, category.id));
          return null;
        },
      });
    },
  },
});
