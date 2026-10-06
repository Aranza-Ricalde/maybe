import { parseTransactionKindGroup } from "@/domain/ledger/rules";
import type { TransactionFilters } from "@/domain/ledger/filters";
import type { TransactionFiltersValue } from "./TransactionsFilterBar";

export function toApiTransactionFilters(f: TransactionFiltersValue): TransactionFilters {
  const amountCents = f.amountValue ? Math.round(Number(f.amountValue) * 100) : undefined;
  return {
    accountId: f.accountId ? Number(f.accountId) : undefined,
    categoryId: f.categoryId ? Number(f.categoryId) : undefined,
    kindGroup: parseTransactionKindGroup(f.kindGroup),
    fromDate: f.dateRange.start ?? undefined,
    toDate: f.dateRange.end ?? undefined,
    minAmountCents: amountCents != null && f.amountMode === "min" ? amountCents : undefined,
    maxAmountCents: amountCents != null && f.amountMode === "max" ? amountCents : undefined,
    search: f.search.trim() || undefined,
  };
}
