import type { DashboardRepository } from "@/domain/dashboard/ports";
import { type EvolutionPoint, type EvolutionRangeKey, rangeBounds } from "@/domain/evolution/rules";
import { balanceSeriesForAccounts } from "./getFinancialEvolution";

export class GetAccountBalanceHistoryUseCase {
  constructor(private readonly repo: DashboardRepository) {}

  async execute(accountId: number, range: EvolutionRangeKey, today: string): Promise<EvolutionPoint[]> {
    const bounds = rangeBounds(range, today);
    return balanceSeriesForAccounts(this.repo, [accountId], bounds, today);
  }
}
