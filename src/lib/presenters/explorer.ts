import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { SPENDING_NATURE_LABELS, SPENDING_NATURES } from "@/domain/categories/nature";
import type { ExplorerResult } from "@/domain/explorer/rules";

export const EXPLORER_ALL = "";
export const UNIDENTIFIED_FILTER = "Sin comercio identificado";

export interface ExplorerFilterValues {
  accountId: string;
  categoryId: string;
  merchant: string;
  nature: string;
}

export interface ExplorerOption {
  id: string;
  label: string;
}

export interface ExplorerOptions {
  accounts: ExplorerOption[];
  categories: ExplorerOption[];
  merchants: ExplorerOption[];
  natures: ExplorerOption[];
}

export function buildExplorerOptions(accounts: AccountOption[], categories: CategoryOption[], result: ExplorerResult | null, selectedMerchant: string): ExplorerOptions {
  const merchantNames = [...new Set([...(selectedMerchant ? [selectedMerchant] : []), ...(result?.merchantOptions ?? []), ...(result?.unidentified ? [UNIDENTIFIED_FILTER] : [])])];
  return {
    accounts: [{ id: EXPLORER_ALL, label: "Todas" }, ...accounts.map((a) => ({ id: String(a.id), label: a.name }))],
    categories: [{ id: EXPLORER_ALL, label: "Todas" }, ...categories.map((c) => ({ id: String(c.id), label: c.label ?? c.name }))],
    merchants: [{ id: EXPLORER_ALL, label: "Todos" }, ...merchantNames.map((name) => ({ id: name, label: name }))],
    natures: [{ id: EXPLORER_ALL, label: "Todos" }, ...SPENDING_NATURES.map((n) => ({ id: n, label: SPENDING_NATURE_LABELS[n] }))],
  };
}
