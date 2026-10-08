import type { AccountsReader } from "@/domain/readModels/ports";
import type { ExplorerResult } from "@/domain/explorer/rules";
import { evolutionRangeFor, toStatsExplorerFilters, type StatsParams } from "@/domain/stats/params";
import type { CashProjectionView, GetCashProjectionUseCase } from "./getCashProjection";
import type { GetExplorerUseCase } from "./getExplorer";
import type { ResolvePeriodContextUseCase } from "./pages/resolvePeriodContext";
import type { AccountsBalanceHistory, GetAccountsBalanceHistoryUseCase } from "./getAccountsBalanceHistory";

export interface StatsData {
  explorer: ExplorerResult;
  projection: CashProjectionView | null;
  accounts: AccountsBalanceHistory | null;
}

export class GetStatsUseCase {
  constructor(
    private readonly explorer: GetExplorerUseCase,
    private readonly cashProjection: GetCashProjectionUseCase,
    private readonly accountsHistory: GetAccountsBalanceHistoryUseCase,
    private readonly accountsReader: AccountsReader,
    private readonly periods: ResolvePeriodContextUseCase,
  ) {}

  async execute(familyId: number, params: StatsParams, today: string): Promise<StatsData> {
    const { displayPeriod } = await this.periods.execute(familyId, today, undefined);
    const currentPeriod = { from: displayPeriod.start, to: displayPeriod.end };
    const filters = toStatsExplorerFilters(params, today, currentPeriod);
    const wantsAccounts = params.metric === "balance" && params.group === "account";

    const [explorer, projection, accounts] = await Promise.all([
      this.explorer.execute(familyId, filters, today),
      params.projection ? this.cashProjection.execute(familyId, today) : Promise.resolve(null),
      wantsAccounts ? this.loadAccounts(familyId, params, today) : Promise.resolve(null),
    ]);
    return { explorer, projection, accounts };
  }

  private async loadAccounts(familyId: number, params: StatsParams, today: string): Promise<AccountsBalanceHistory> {
    const active = await this.accountsReader.listActive(familyId);
    return this.accountsHistory.execute(active.map(({ id, name }) => ({ id, name })), evolutionRangeFor(params.preset), today);
  }
}
