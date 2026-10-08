import { pickDefaultAccountId, summarizeAccountsTotals } from "@/domain/accounts/rules";
import { accountRowsView } from "@/domain/accounts/view";
import type { AccountsReader } from "@/domain/readModels/ports";
import type { GetAccountBalanceHistoryUseCase } from "../getAccountBalanceHistory";

const INITIAL_RANGE = "30d";

export class GetAccountsPageUseCase {
  constructor(
    private readonly accounts: AccountsReader,
    private readonly balanceHistory: GetAccountBalanceHistoryUseCase,
  ) {}

  async execute(familyId: number, today: string) {
    const [active, archived] = await Promise.all([this.accounts.listActive(familyId), this.accounts.listArchived(familyId)]);
    const defaultAccountId = pickDefaultAccountId(active);

    const [balanceByAccount, initialBalanceSeries] = await Promise.all([
      this.accounts.balancesAsOf(active.map((account) => account.id), today),
      defaultAccountId == null ? Promise.resolve([]) : this.balanceHistory.execute(defaultAccountId, INITIAL_RANGE, today),
    ]);

    const rows = accountRowsView(active, balanceByAccount);

    return {
      accounts: rows,
      totals: summarizeAccountsTotals(rows),
      archivedAccounts: archived.map(({ id, name, type }) => ({ id, name, type })),
      initialBalanceSeries,
    };
  }
}
