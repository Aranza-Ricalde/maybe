import type { RecurringCandidateRecord, RecurringCandidateRepository } from "@/domain/recurring/ports";
import { detectRecurringGroups } from "@/domain/recurring/rules";

const MONTHS_LOOKBACK = 6;

export class DetectRecurringItemsUseCase {
  constructor(private readonly repo: RecurringCandidateRepository) {}

  async execute(familyId: number): Promise<RecurringCandidateRecord[]> {
    const transactions = await this.repo.getRecentTransactions(familyId, MONTHS_LOOKBACK);
    const groups = detectRecurringGroups(transactions);
    if (groups.length === 0) return [];

    const existing = await this.repo.findExistingPatternSignatures(familyId, groups.map((g) => g.patternSignature));
    const newGroups = groups.filter((g) => !existing.has(g.patternSignature));
    if (newGroups.length === 0) return [];

    return this.repo.createCandidates(familyId, newGroups);
  }
}
