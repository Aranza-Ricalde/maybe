import type { BudgetCadence } from "./rules";

export interface BudgetCategorySettingRecord {
  familyId: number;
  categoryId: number;
  cadence: BudgetCadence;
  budgetedAmountCents: number;
}

export interface BudgetsRepository {
  listForFamily(familyId: number): Promise<BudgetCategorySettingRecord[]>;
  setLine(familyId: number, categoryId: number, cadence: BudgetCadence, budgetedAmountCents: number): Promise<void>;
  deleteLine(familyId: number, categoryId: number): Promise<void>;
}
