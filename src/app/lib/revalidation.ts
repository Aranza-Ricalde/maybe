import "server-only";
import { revalidatePath } from "next/cache";
import { ROUTES, type AppRoute } from "@/domain/shared/routes";

export const REVALIDATE = {
  accounts: [ROUTES.accounts, ROUTES.dashboard],
  transactions: [ROUTES.transactions, ROUTES.dashboard],
  transferReview: [ROUTES.transactions, ROUTES.dashboard, ROUTES.stats, ROUTES.budgets],
  captureReview: [ROUTES.transactions, ROUTES.dashboard, ROUTES.stats, ROUTES.budgets],
  statementImport: [ROUTES.transactions, ROUTES.dashboard, ROUTES.stats, ROUTES.budgets, ROUTES.accounts, ROUTES.stats],
  goals: [ROUTES.goals, ROUTES.dashboard],
  budgetLines: [ROUTES.budgets, ROUTES.dashboard],
  categories: [ROUTES.settings, ROUTES.budgets, ROUTES.transactions, ROUTES.dashboard],
  payPeriods: [ROUTES.settings, ROUTES.budgets, ROUTES.dashboard],
  periodView: [ROUTES.settings, ROUTES.budgets, ROUTES.dashboard, ROUTES.stats],
  recurring: [ROUTES.recurring, ROUTES.dashboard],
  recurringBudget: [ROUTES.recurring, ROUTES.budgets, ROUTES.dashboard],
  recurringPolicy: [ROUTES.recurring, ROUTES.budgets],
  conceptConfirmed: [ROUTES.dashboard, ROUTES.transactions],
  settingsOnly: [ROUTES.settings],
  dashboard: [ROUTES.dashboard],
  stats: [ROUTES.stats],
} as const satisfies Record<string, readonly AppRoute[]>;

export function revalidateRoutes(routes: readonly AppRoute[]): void {
  for (const route of routes) revalidatePath(route);
}
