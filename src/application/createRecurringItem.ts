import type { ConceptsRepository } from "@/domain/concepts/ports";
import { inclusionForNewItem } from "@/domain/recurring/budgetInclusion";
import type { RecurringBudgetRepository, RecurringItemsRepository } from "@/domain/recurring/ports";
import type { Flow } from "@/domain/ledger/rules";
import { ensureConcept } from "./ensureConcept";
import {
  assertValidRecurringDay,
  assertValidEstimatedAmount,
  assertValidRecurringFlow,
  assertValidRecurringItemName,
  signedEstimatedAmountCents,
} from "@/domain/recurring/rules";

export interface CreateRecurringItemRequest {
  familyId: number;
  name: string;
  flow: Flow;
  estimatedAmount: number;
  dayOfMonth: number;
  categoryId: number | null;
  accountId: number | null;
}

export class CreateRecurringItemUseCase {
  constructor(
    private readonly repo: RecurringItemsRepository,
    private readonly conceptsRepo: ConceptsRepository,
    private readonly budgetRepo?: RecurringBudgetRepository,
  ) {}

  async execute(input: CreateRecurringItemRequest): Promise<void> {
    assertValidEstimatedAmount(input.estimatedAmount);
    assertValidRecurringDay(input.dayOfMonth);
    assertValidRecurringItemName(input.name);
    assertValidRecurringFlow(input.flow);

    const concept =
      input.categoryId != null
        ? await ensureConcept(this.conceptsRepo, { familyId: input.familyId, name: input.name, categoryId: input.categoryId, flow: input.flow })
        : null;

    const magnitudeCents = Math.round(input.estimatedAmount * 100);
    await this.repo.create({
      familyId: input.familyId,
      name: input.name,
      flow: input.flow,
      estimatedAmountCents: signedEstimatedAmountCents(input.flow, magnitudeCents),
      dayOfMonth: input.dayOfMonth,
      categoryId: input.categoryId,
      conceptId: concept?.id ?? null,
      accountId: input.accountId,
      autoDetected: false,
      budgetInclusion: this.budgetRepo ? inclusionForNewItem(await this.budgetRepo.getPolicy(input.familyId)) : null,
    });
  }
}
