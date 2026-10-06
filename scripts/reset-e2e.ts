import { sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";

const E2E_HOST_FRAGMENT = "ep-frosty-boat-b45l6qth";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.includes(E2E_HOST_FRAGMENT)) {
    throw new Error(
      `DATABASE_URL no apunta al branch e2e-tests esperado (falta "${E2E_HOST_FRAGMENT}"). Abortando para no truncar la base equivocada.`,
    );
  }

  console.log("Truncando todas las tablas de usuario en el branch e2e-tests...");
  await db.execute(sql`
    TRUNCATE TABLE
      families, users, sessions,
      accounts, account_balances_daily,
      transactions, transfers, rejected_transfers, transaction_tags, valuations,
      categories, tags, merchant_patterns,
      providers, concepts, concept_match_suggestions,
      recurring_items, recurring_candidates, recurring_occurrences, scheduled_transactions,
      budget_category_settings, category_monthly_totals, income_expense_monthly,
      pay_periods, goals, goal_accounts,
      imports, import_mappings,
      notification_events, rules
    RESTART IDENTITY CASCADE
  `);
  console.log("Listo.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
