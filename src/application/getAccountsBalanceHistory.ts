import { mergeSeriesByDate, type EvolutionRangeKey } from "@/domain/evolution/rules";
import type { GetAccountBalanceHistoryUseCase } from "./getAccountBalanceHistory";

export interface AccountsHistoryAccount {
  id: number;
  name: string;
}

export interface AccountsBalanceHistory {
  accounts: Array<{ key: string; label: string }>;
  points: Array<Record<string, string | number>>;
}

const MAX_ACCOUNTS = 5;
const keyOf = (accountId: number) => `a${accountId}`;

export class GetAccountsBalanceHistoryUseCase {
  constructor(private readonly history: GetAccountBalanceHistoryUseCase) {}

  async execute(accounts: AccountsHistoryAccount[], range: EvolutionRangeKey, today: string, limit = MAX_ACCOUNTS): Promise<AccountsBalanceHistory> {
    const series = await Promise.all(accounts.map(async (account) => ({ account, points: await this.history.execute(account.id, range, today) })));
    const ranked = series
      .map((entry) => ({ ...entry, weight: Math.abs(entry.points.at(-1)?.value ?? 0) }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
    return {
      accounts: ranked.map(({ account }) => ({ key: keyOf(account.id), label: account.name })),
      points: mergeSeriesByDate(ranked.map(({ account, points }) => ({ key: keyOf(account.id), points }))),
    };
  }
}
