import type { InsightExpense } from "./rules";

export interface InsightsRepository {
  listExpensesSince(familyId: number, fromDate: string): Promise<InsightExpense[]>;
  getUncategorized(familyId: number): Promise<{ count: number; totalCents: number }>;
}
