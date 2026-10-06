import type { FlowReader } from "@/domain/dashboard/ports";
import { shiftMonth } from "@/domain/dashboard/rules";
import { monthStart } from "@/domain/ledger/rules";
import { buildTrendSummary, type TrendSummary } from "@/domain/trends/rules";

const MONTHS_BACK = 13;

export class GetTrendsUseCase {
  constructor(private readonly repo: FlowReader) {}

  async execute(familyId: number, today: string): Promise<TrendSummary | null> {
    const current = monthStart(today);
    const rows = await this.repo.getMonthlyFlowRange(familyId, shiftMonth(current, -MONTHS_BACK), shiftMonth(current, -1));
    return buildTrendSummary(
      rows.map((r) => ({ month: r.month, expenseCents: Math.abs(r.expenseCents) })),
      current,
    );
  }
}
