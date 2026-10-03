import type { TransactionFilters } from "@/app/lib/queries";
import type { TransactionFiltersValue } from "@/components/organisms/TransactionsFilterBar";

export function toApiTransactionFilters(f: TransactionFiltersValue): TransactionFilters {
  const amountCents = f.amountValue ? Math.round(Number(f.amountValue) * 100) : undefined;
  return {
    accountId: f.accountId ? Number(f.accountId) : undefined,
    categoryId: f.categoryId ? Number(f.categoryId) : undefined,
    fromDate: f.dateRange.start ?? undefined,
    toDate: f.dateRange.end ?? undefined,
    minAmountCents: amountCents != null && f.amountMode === "min" ? amountCents : undefined,
    maxAmountCents: amountCents != null && f.amountMode === "max" ? amountCents : undefined,
    search: f.search.trim() || undefined,
  };
}
