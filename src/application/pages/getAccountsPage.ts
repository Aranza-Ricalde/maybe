import { summarizeAccountsTotals } from "@/domain/accounts/rules";
import { accountRowsView } from "@/domain/accounts/view";
import type { AccountsReader } from "@/domain/readModels/ports";
import type { GetDebtOverviewUseCase } from "../getDebtOverview";
import type { GetAccountsBalanceHistoryUseCase } from "../getAccountsBalanceHistory";

const INITIAL_RANGE = "30d";

export class GetAccountsPageUseCase {
  constructor(
    private readonly accounts: AccountsReader,
    private readonly accountsHistory: GetAccountsBalanceHistoryUseCase,
    private readonly debtOverview: GetDebtOverviewUseCase,
  ) {}

  async execute(familyId: number, today: string) {
    const [active, archived] = await Promise.all([this.accounts.listActive(familyId), this.accounts.listArchived(familyId)]);
    const [balanceByAccount, initialAccountsHistory, debts] = await Promise.all([
      this.accounts.balancesAsOf(active.map((account) => account.id), today),
      this.accountsHistory.execute(active.map(({ id, name }) => ({ id, name })), INITIAL_RANGE, today, active.length),
      this.debtOverview.execute(familyId, today),
    ]);

    const rows = accountRowsView(active, balanceByAccount);

    return {
      accounts: rows,
      totals: summarizeAccountsTotals(rows),
      archivedAccounts: archived.map(({ id, name, type }) => ({ id, name, type })),
      initialAccountsHistory,
      debts,
    };
  }
}
