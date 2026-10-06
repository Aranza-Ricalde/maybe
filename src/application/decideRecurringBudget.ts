import {
  InvalidBudgetDecisionError,
  assertValidBudgetDecision,
  inclusionOfDecision,
  policyOfDecision,
} from "@/domain/recurring/budgetInclusion";
import type { RecurringBudgetRepository } from "@/domain/recurring/ports";

export interface DecideRecurringBudgetInput {
  familyId: number;
  recurringItemId: number;
  decision: string;
  rememberForAll?: boolean;
}

export class DecideRecurringBudgetUseCase {
  constructor(private readonly repo: RecurringBudgetRepository) {}

  async execute(input: DecideRecurringBudgetInput): Promise<void> {
    assertValidBudgetDecision(input.decision);
    const item = await this.repo.getItem(input.recurringItemId);
    if (!item || item.familyId !== input.familyId) throw new InvalidBudgetDecisionError("El recurrente no existe.");

    const inclusion = inclusionOfDecision(input.decision);
    await this.repo.setInclusion(item.id, inclusion);
    if (input.rememberForAll) {
      await this.repo.setInclusionForUndecided(input.familyId, inclusion);
      await this.repo.setPolicy(input.familyId, policyOfDecision(input.decision));
    }
  }
}

export class ResetRecurringBudgetPolicyUseCase {
  constructor(private readonly repo: RecurringBudgetRepository) {}

  async execute(familyId: number): Promise<void> {
    await this.repo.setPolicy(familyId, "ask");
  }
}
