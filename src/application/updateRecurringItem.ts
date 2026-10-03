import type { ConceptsRepository } from "@/domain/concepts/ports";
import type { RecurringItemsRepository } from "@/domain/recurring/ports";
import type { Flow } from "@/domain/ledger/rules";
import {
  assertValidDayOfMonth,
  assertValidEstimatedAmount,
  assertValidRecurringItemName,
  InvalidRecurringItemError,
  signedEstimatedAmountCents,
} from "@/domain/recurring/rules";

export interface UpdateRecurringItemRequest {
  id: number;
  name: string;
  flow: Flow;
  estimatedAmount: number;
  dayOfMonth: number;
  categoryId: number | null;
  conceptId: number | null;
  accountId: number | null;
}

export class UpdateRecurringItemUseCase {
  constructor(
    private readonly repo: RecurringItemsRepository,
    private readonly conceptsRepo: ConceptsRepository,
  ) {}

  async execute(input: UpdateRecurringItemRequest): Promise<void> {
    assertValidEstimatedAmount(input.estimatedAmount);
    assertValidDayOfMonth(input.dayOfMonth);

    let name = input.name;
    let categoryId = input.categoryId;
    let flow = input.flow;

    if (input.conceptId != null) {
      const concept = await this.conceptsRepo.getById(input.conceptId);
      if (!concept) throw new InvalidRecurringItemError(`el concepto ${input.conceptId} no existe`);
      name = concept.name;
      categoryId = concept.categoryId;
      flow = concept.flow;
    }
    assertValidRecurringItemName(name);

    const magnitudeCents = Math.round(input.estimatedAmount * 100);
    await this.repo.update({
      id: input.id,
      name,
      flow,
      estimatedAmountCents: signedEstimatedAmountCents(flow, magnitudeCents),
      dayOfMonth: input.dayOfMonth,
      categoryId,
      conceptId: input.conceptId,
      accountId: input.accountId,
    });
  }
}
