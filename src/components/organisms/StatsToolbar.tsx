"use client";

import { FilterPanel } from "@/components/molecules/FilterPanel";
import { PeriodPicker } from "@/components/molecules/PeriodPicker";
import { Toggle } from "@/components/ui/toggle";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { EXPLORER_PRESET_LABELS, EXPLORER_PRESETS, type ExplorerPreset, type PresetRange } from "@/domain/explorer/presets";
import type { ExplorerResult } from "@/domain/explorer/rules";
import type { StatsParams } from "@/domain/stats/params";
import { formatDateRange } from "@/lib/format";
import { buildExplorerOptions } from "@/lib/presenters/explorer";
import { statsFilterPatch, statsFilterValues } from "@/lib/presenters/statsFilters";

const PRESET_OPTIONS = EXPLORER_PRESETS.filter((preset) => preset !== "custom").map((value) => ({ value, label: EXPLORER_PRESET_LABELS[value] }));

export interface StatsToolbarProps {
  params: StatsParams;
  range: PresetRange;
  accounts: AccountOption[];
  categories: CategoryOption[];
  result: ExplorerResult;
  canCompare: boolean;
  onChange: (patch: Partial<StatsParams>) => void;
  onClearFilters: () => void;
}

export function StatsToolbar({ params, range, accounts, categories, result, canCompare, onChange, onClearFilters }: StatsToolbarProps) {
  const values = statsFilterValues(params);
  const options = buildExplorerOptions(accounts, categories, result, values.merchant);
  const group = (key: keyof typeof values, label: string, list: { id: string; label: string }[]) => ({ key, label, options: list, value: values[key], onChange: (value: string) => onChange(statsFilterPatch(key, value)) });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PeriodPicker
        presets={PRESET_OPTIONS}
        value={params.preset}
        isCustom={params.preset === "custom"}
        customLabel={formatDateRange(range.from, range.to)}
        customRange={params.from && params.to ? { start: params.from, end: params.to } : null}
        onPresetChange={(value) => onChange({ preset: value as ExplorerPreset })}
        onCustomChange={(value) => onChange({ preset: "custom", from: value.start, to: value.end })}
      />
      <Toggle variant="outline" size="sm" pressed={params.compare} disabled={!canCompare} onPressedChange={(compare) => onChange({ compare })} aria-label="Comparar con el periodo anterior">
        Comparar
      </Toggle>
      <FilterPanel
        onClear={onClearFilters}
        groups={[group("accountId", "Cuenta", options.accounts), group("categoryId", "Categoría", options.categories), group("merchant", "Comercio", options.merchants), group("nature", "Tipo de gasto", options.natures)]}
      />
    </div>
  );
}
