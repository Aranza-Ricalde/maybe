import { useCallback, useMemo, useState, useTransition } from "react";
import { pickDefaultAccountId } from "@/domain/accounts/rules";
import { rangeBounds, type EvolutionPoint, type EvolutionRangeKey } from "@/domain/evolution/rules";
import type { AccountOption } from "@/components/viewModels";
import { usePaginatedFilterTable, type SortState } from "./usePaginatedFilterTable";

export interface AccountTransactionRow {
  id: number;
  date: string;
  amountCents: number;
  name: string;
  categoryName: string | null;
}

export type FetchAccountMovements = (accountId: number, fromDate: string, toDate: string, page: number, pageSize: number) => Promise<{ rows: AccountTransactionRow[]; total: number }>;
export type LoadBalanceHistory = (accountId: number, range: EvolutionRangeKey) => Promise<EvolutionPoint[]>;

interface AccountExplorerFilters {
  accountId: number | null;
  range: EvolutionRangeKey;
}

export interface UseAccountExplorerOptions {
  accounts: AccountOption[];
  initialSeries: EvolutionPoint[];
  loadBalanceHistory: LoadBalanceHistory;
  fetchTransactionsPage: FetchAccountMovements;
  today: string;
}

const DEFAULT_RANGE: EvolutionRangeKey = "30d";
const historyKey = (accountId: number, range: EvolutionRangeKey) => `${accountId}:${range}`;

export function useAccountExplorer({ accounts, initialSeries, loadBalanceHistory, fetchTransactionsPage, today }: UseAccountExplorerOptions) {
  const [accountId, setAccountId] = useState<number | null>(() => pickDefaultAccountId(accounts));
  const [range, setRange] = useState<EvolutionRangeKey>(DEFAULT_RANGE);
  const [loadedHistory, setLoadedHistory] = useState<Record<string, EvolutionPoint[]>>(() => {
    const defaultAccountId = pickDefaultAccountId(accounts);
    return defaultAccountId == null ? {} : { [historyKey(defaultAccountId, DEFAULT_RANGE)]: initialSeries };
  });
  const [isLoadingHistory, startLoadingHistory] = useTransition();

  function select(nextAccountId: number, nextRange: EvolutionRangeKey) {
    setAccountId(nextAccountId);
    setRange(nextRange);
    const key = historyKey(nextAccountId, nextRange);
    if (loadedHistory[key]) return;
    startLoadingHistory(async () => {
      const series = await loadBalanceHistory(nextAccountId, nextRange);
      setLoadedHistory((current) => ({ ...current, [key]: series }));
    });
  }

  const filters = useMemo<AccountExplorerFilters>(() => ({ accountId, range }), [accountId, range]);

  const fetchPage = useCallback(
    async (f: AccountExplorerFilters, _sort: SortState<"date">, page: number, pageSize: number) => {
      if (f.accountId === null) return { rows: [], total: 0 };
      return fetchTransactionsPage(f.accountId, rangeBounds(f.range, today).fromDate, today, page, pageSize);
    },
    [fetchTransactionsPage, today],
  );

  const table = usePaginatedFilterTable<AccountTransactionRow, AccountExplorerFilters, "date">({
    filters,
    initialSort: { field: "date", direction: "desc" },
    fetchPage,
    initialPageSize: 10,
  });

  return {
    accountId,
    range,
    series: accountId === null ? undefined : loadedHistory[historyKey(accountId, range)],
    selectedName: accounts.find((account) => account.id === accountId)?.name ?? "",
    isLoadingHistory,
    selectAccount: (nextAccountId: number) => select(nextAccountId, range),
    selectRange: (nextRange: EvolutionRangeKey) => accountId !== null && select(accountId, nextRange),
    table,
  };
}
