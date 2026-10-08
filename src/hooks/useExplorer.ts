import { useMemo, useState } from "react";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { resolvePreset, type ExplorerPreset, type PresetRange } from "@/domain/explorer/presets";
import type { ExplorerResult } from "@/domain/explorer/rules";
import { EMPTY_EXPLORER_VALUES, EXPLORER_ALL, buildExplorerOptions, describeDelta, toExplorerFilters, type ExplorerFilterValues, type ExplorerView } from "@/lib/presenters/explorer";
import { waterfallSteps } from "@/lib/presenters/charts";
import { useExplorerData } from "./useExplorerData";

export interface UseExplorerOptions {
  initialView: ExplorerView;
  initialPreset: ExplorerPreset;
  initialResult: ExplorerResult;
  today: string;
  currentPeriod: PresetRange | null;
  accounts: AccountOption[];
  categories: CategoryOption[];
  loadAction: (args: unknown) => Promise<ExplorerResult | null>;
}

export function useExplorer({ initialView, initialPreset, initialResult, today, currentPeriod, accounts, categories, loadAction }: UseExplorerOptions) {
  const [view, setView] = useState<ExplorerView>(initialView);
  const [preset, setPreset] = useState<ExplorerPreset>(initialPreset);
  const [custom, setCustom] = useState<PresetRange | null>(null);
  const [values, setValues] = useState<ExplorerFilterValues>(EMPTY_EXPLORER_VALUES);

  const range = resolvePreset(preset, today, currentPeriod, custom);
  const filters = useMemo(() => toExplorerFilters({ from: range.from, to: range.to }, values), [range.from, range.to, values]);
  const { result, isLoading, hasFailed } = useExplorerData(filters, initialResult, loadAction);
  const options = buildExplorerOptions(accounts, categories, result, values.merchant);

  const setValue = (key: keyof ExplorerFilterValues) => (value: string) => setValues((current) => ({ ...current, [key]: value }));

  return {
    view,
    setView,
    preset,
    setPreset,
    range,
    custom,
    chooseCustomRange: (next: PresetRange) => {
      setCustom(next);
      setPreset("custom");
    },
    values,
    setValue,
    clearFilters: () => setValues(EMPTY_EXPLORER_VALUES),
    drillIntoCategory: (categoryId: number) => {
      setValues((current) => ({ ...current, categoryId: String(categoryId) }));
      setView("category");
    },
    selectCategory: (categoryId: number) => setValues((current) => ({ ...current, categoryId: String(categoryId) })),
    clearCategory: () => setValues((current) => ({ ...current, categoryId: EXPLORER_ALL })),
    selectMerchant: (merchant: string) => setValues((current) => ({ ...current, merchant })),
    options,
    result,
    isLoading,
    hasFailed,
    delta: result?.comparison ? describeDelta(result.comparison) : null,
    waterfall: result?.comparison ? waterfallSteps({ previousCents: result.comparison.expenseCents, currentCents: result.expenseCents, drivers: result.comparison.drivers }) : [],
  };
}
