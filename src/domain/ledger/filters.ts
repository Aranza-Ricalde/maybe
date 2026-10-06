import type { TransactionKindGroup } from "./rules";

export interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  kindGroup?: TransactionKindGroup;
  fromDate?: string;
  toDate?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
  search?: string;
}

export interface TransactionSort {
  field: "date" | "amount" | "name";
  direction: "asc" | "desc";
}
