import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { SPENDING_NATURE_LABELS, SPENDING_NATURES, type SpendingNature } from "@/domain/categories/nature";
import { EXPLORER_PRESETS, EXPLORER_PRESET_LABELS, type PresetRange } from "@/domain/explorer/presets";
import type { ExplorerComparison, ExplorerFilters, ExplorerResult } from "@/domain/explorer/rules";
import { formatSignedPercent, formatSignedPesos } from "@/lib/format";

export const EXPLORER_VIEWS = ["flow", "category", "merchant", "balance", "change"] as const;
export type ExplorerView = (typeof EXPLORER_VIEWS)[number];

export const EXPLORER_ALL = "";
export const UNIDENTIFIED_FILTER = "Sin comercio identificado";

const VIEW_LABELS: Record<ExplorerView, string> = { flow: "Ingresos y gastos", category: "Por categoría", merchant: "Por comercio", balance: "Saldo", change: "Qué cambió" };
export const EXPLORER_VIEW_OPTIONS = EXPLORER_VIEWS.map((value) => ({ value, label: VIEW_LABELS[value] }));
export const EXPLORER_PRESET_OPTIONS = EXPLORER_PRESETS.filter((preset) => preset !== "custom").map((value) => ({ value, label: EXPLORER_PRESET_LABELS[value] }));

export interface ExplorerFilterValues {
  accountId: string;
  categoryId: string;
  merchant: string;
  nature: string;
}

export const EMPTY_EXPLORER_VALUES: ExplorerFilterValues = { accountId: EXPLORER_ALL, categoryId: EXPLORER_ALL, merchant: EXPLORER_ALL, nature: EXPLORER_ALL };

export function toExplorerFilters(range: PresetRange, values: ExplorerFilterValues): ExplorerFilters {
  return {
    from: range.from,
    to: range.to,
    accountId: values.accountId ? Number(values.accountId) : null,
    categoryId: values.categoryId ? Number(values.categoryId) : null,
    merchant: values.merchant || null,
    nature: (values.nature as SpendingNature) || null,
  };
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

export interface DeltaView {
  tone: "up" | "down" | "flat";
  label: string;
}

export function describeDelta(comparison: Pick<ExplorerComparison, "deltaExpenseCents" | "deltaExpensePct">): DeltaView {
  const delta = comparison.deltaExpenseCents;
  if (delta === 0) return { tone: "flat", label: "Igual que el periodo anterior" };
  const pct = comparison.deltaExpensePct != null ? ` (${formatSignedPercent(comparison.deltaExpensePct)})` : "";
  return { tone: delta > 0 ? "up" : "down", label: `${formatSignedPesos(delta)}${pct}` };
}
