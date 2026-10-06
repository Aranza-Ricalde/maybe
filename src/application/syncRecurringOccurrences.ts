import { assertValidIsoDate } from "@/domain/ledger/rules";
import { isEmptyOccurrenceSyncPlan, planOccurrenceSync } from "@/domain/recurring/occurrences";
import type { RecurringOccurrencesRepository } from "@/domain/recurring/ports";
import { assertValidOccurrenceMatchSource, assertValidOccurrenceStatus } from "@/domain/recurring/rules";

export interface SyncRecurringOccurrencesResult {
  created: number;
  linked: number;
  unlinked: number;
}

export class SyncRecurringOccurrencesUseCase {
  constructor(private readonly repo: RecurringOccurrencesRepository) {}

  async execute(familyId: number, periodStart: string, periodEnd: string): Promise<SyncRecurringOccurrencesResult> {
    assertValidIsoDate(periodStart);
    assertValidIsoDate(periodEnd);

    const [items, existing, transactions] = await Promise.all([
      this.repo.getRecurringItems(familyId),
      this.repo.listOccurrences(familyId, periodStart, periodEnd),
      this.repo.listTransactions(familyId, periodStart, periodEnd),
    ]);

    const plan = planOccurrenceSync({ items, existing, transactions, periodStart, periodEnd });
    if (isEmptyOccurrenceSyncPlan(plan)) return { created: 0, linked: 0, unlinked: 0 };

    for (const o of plan.toCreate) {
      assertValidOccurrenceStatus(o.status);
      if (o.matchSource != null) assertValidOccurrenceMatchSource(o.matchSource);
    }

    await this.repo.applyPlan(familyId, plan);
    return { created: plan.toCreate.length, linked: plan.toLink.length, unlinked: plan.toUnlink.length };
  }
}
