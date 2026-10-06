import type { AccountSnapshotReader, BalanceReader } from "@/domain/dashboard/ports";
import type { EmergencyFundGoalRepository } from "@/domain/wealth/ports";
import { DEFAULT_EMERGENCY_FUND_TARGET_MONTHS, emergencyFund, type EmergencyFundResult } from "@/domain/wealth/rules";
import type { CategoryStatsReader } from "@/domain/categoryStats/ports";

export interface EmergencyFundView extends EmergencyFundResult {
  fundCents: number;
  essentialMonthlyCents: number | null;
  source: "goal" | "savings";
}

export class GetEmergencyFundUseCase {
  constructor(
    private readonly dashboardRepo: AccountSnapshotReader & BalanceReader,
    private readonly categoryStats: CategoryStatsReader,
    private readonly goalRepo: EmergencyFundGoalRepository,
  ) {}

  async execute(familyId: number, today: string): Promise<EmergencyFundView> {
    const [goal, stats] = await Promise.all([this.goalRepo.findEmergencyFundGoal(familyId), this.categoryStats.execute(familyId, today)]);
    const linked = goal != null && goal.accountIds.length > 0;
    const fundCents = linked
      ? await this.dashboardRepo.getBalanceAt(goal.accountIds, today)
      : (await this.dashboardRepo.getSavingsAccounts(familyId, today)).reduce((sum, a) => sum + a.balanceCents, 0);

    const essential = stats.natures.find((n) => n.nature === "essential")?.avgLast3Cents ?? 0;
    const essentialMonthlyCents = essential > 0 ? essential : null;

    return {
      fundCents,
      essentialMonthlyCents,
      source: linked ? "goal" : "savings",
      ...emergencyFund({ fundCents, essentialMonthlyCents, targetMonths: DEFAULT_EMERGENCY_FUND_TARGET_MONTHS, targetCents: linked ? goal.targetAmountCents : null }),
    };
  }
}
