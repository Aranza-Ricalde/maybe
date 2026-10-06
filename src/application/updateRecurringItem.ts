import type { ConceptsRepository } from "@/domain/concepts/ports";
import type { RecurringItemsRepository } from "@/domain/recurring/ports";
import type { Flow } from "@/domain/ledger/rules";
import {
  assertValidDayOfMonth,
  assertValidEstimatedAmount,
  assertValidRecurringFlow,
  assertValidRecurringItemName,
  InvalidRecurringItemError,
  signedEstimatedAmountCents,
} from "@/domain/recurring/rules";
import { ensureConcept } from "./ensureConcept";

export interface UpdateRecurringItemRequest {
  id: number;
  name: string;
  flow: Flow;
  estimatedAmount: number;
  dayOfMonth: number;
  categoryId: number | null;
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
    assertValidRecurringItemName(input.name);
    assertValidRecurringFlow(input.flow);

    const current = await this.repo.getById(input.id);
    if (!current) throw new InvalidRecurringItemError(`el recurrente ${input.id} no existe`);

    const conceptId = await this.conceptFollowingItem(current.familyId, current.conceptId, input);

    const magnitudeCents = Math.round(input.estimatedAmount * 100);
    await this.repo.update({
      id: input.id,
      name: input.name,
      flow: input.flow,
      estimatedAmountCents: signedEstimatedAmountCents(input.flow, magnitudeCents),
      dayOfMonth: input.dayOfMonth,
      categoryId: input.categoryId,
      conceptId,
      accountId: input.accountId,
    });
  }

  private async conceptFollowingItem(familyId: number, currentConceptId: number | null, input: UpdateRecurringItemRequest): Promise<number | null> {
    if (input.categoryId == null) return null;

    const current = currentConceptId != null ? await this.conceptsRepo.getById(currentConceptId) : null;
    if (!current || current.familyId !== familyId) {
      return (await ensureConcept(this.conceptsRepo, { familyId, name: input.name, categoryId: input.categoryId, flow: input.flow })).id;
    }

    const sameName = await this.conceptsRepo.findByName(familyId, input.name);
    if (sameName && sameName.id !== current.id) return sameName.id;

    if (current.name !== input.name || current.categoryId !== input.categoryId) {
      await this.conceptsRepo.update({ id: current.id, name: input.name, categoryId: input.categoryId, providerId: current.providerId });
    }
    return current.id;
  }
}
