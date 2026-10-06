import type { MonthlyCategorySpend, StatCategory } from "./rules";

export interface CategoryStatsRepository {
  listCategories(familyId: number): Promise<StatCategory[]>;
  getMonthlySpend(familyId: number, fromDate: string, toDate: string): Promise<MonthlyCategorySpend[]>;
}

export interface CategoryStatsReader {
  execute(familyId: number, today: string): Promise<import("./rules").CategoryStats>;
}
