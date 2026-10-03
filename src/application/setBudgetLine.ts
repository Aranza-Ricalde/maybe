import type { BudgetsRepository } from "@/domain/budget/ports";
import { assertValidBudgetedAmountCents, type BudgetCadence } from "@/domain/budget/rules";

export interface SetBudgetLineInput {
  familyId: number;
  categoryId: number;
  cadence: BudgetCadence;
  budgetedAmountCents: number;
}

export class SetBudgetLineUseCase {
  constructor(private readonly repo: BudgetsRepository) {}

  async execute(input: SetBudgetLineInput): Promise<void> {
    assertValidBudgetedAmountCents(input.budgetedAmountCents);
    await this.repo.setLine(input.familyId, input.categoryId, input.cadence, input.budgetedAmountCents);
  }
}
