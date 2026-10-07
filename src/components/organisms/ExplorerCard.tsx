"use client";

import { FunnelXmark } from "@gravity-ui/icons";
import { Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { FilterSelect } from "@/components/molecules/FilterSelect";
import { ACTIVE_ACCENT, ACTIVE_NEUTRAL, SegmentedButtons } from "@/components/molecules/SegmentedButtons";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { SPENDING_NATURE_LABELS, SPENDING_NATURES, type SpendingNature } from "@/domain/categories/nature";
import { EXPLORER_PRESETS, EXPLORER_PRESET_LABELS, resolvePreset, type ExplorerPreset, type PresetRange } from "@/domain/explorer/presets";
import { type ExplorerFilters, type ExplorerResult } from "@/domain/explorer/rules";
import { useExplorerData } from "@/hooks/useExplorerData";
import { formatPesos, formatShortDate, formatSignedPercent } from "@/lib/format";
import { DateRangeFilter, type DateRangeValue } from "./DateRangeFilter";
import { ExplorerBreakdown } from "./ExplorerBreakdown";
import { ExplorerFlowChart } from "./ExplorerFlowChart";
import { LineEvolutionChart } from "./LineEvolutionChart";

export const EXPLORER_VIEWS = ["flow", "category", "merchant", "balance"] as const;
export type ExplorerView = (typeof EXPLORER_VIEWS)[number];

const VIEW_LABELS: Record<ExplorerView, string> = { flow: "Ingresos y gastos", category: "Por categoría", merchant: "Por comercio", balance: "Saldo" };
const VIEW_OPTIONS = EXPLORER_VIEWS.map((value) => ({ value, label: VIEW_LABELS[value] }));
const PRESET_OPTIONS = EXPLORER_PRESETS.filter((preset) => preset !== "custom").map((value) => ({ value, label: EXPLORER_PRESET_LABELS[value] }));
const ALL = "";
const UNIDENTIFIED_FILTER = "Sin comercio identificado";

export interface ExplorerCardProps {
  title: string;
  description?: string;
  initialView: ExplorerView;
  initialPreset: ExplorerPreset;
  initialResult: ExplorerResult;
  today: string;
  currentPeriod: PresetRange | null;
  accounts: AccountOption[];
  categories: CategoryOption[];
  loadAction: (args: unknown) => Promise<ExplorerResult | null>;
}

const signedPesos = (cents: number) => `${cents > 0 ? "+" : cents < 0 ? "−" : ""}${formatPesos(Math.abs(cents))}`;
const rangeLabel = (from: string, to: string) => (from === to ? formatShortDate(from) : `${formatShortDate(from)} – ${formatShortDate(to)}`);

export function ExplorerCard({ title, description, initialView, initialPreset, initialResult, today, currentPeriod, accounts, categories, loadAction }: ExplorerCardProps) {
  const [view, setView] = useState<ExplorerView>(initialView);
  const [preset, setPreset] = useState<ExplorerPreset>(initialPreset);
  const [custom, setCustom] = useState<PresetRange | null>(null);
  const [accountId, setAccountId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [merchant, setMerchant] = useState(ALL);
  const [nature, setNature] = useState(ALL);

  const range = resolvePreset(preset, today, currentPeriod, custom);
  const filters = useMemo<ExplorerFilters>(
    () => ({ from: range.from, to: range.to, accountId: accountId ? Number(accountId) : null, categoryId: categoryId ? Number(categoryId) : null, merchant: merchant || null, nature: (nature as SpendingNature) || null }),
    [range.from, range.to, accountId, categoryId, merchant, nature],
  );
  const { result, isLoading, hasFailed } = useExplorerData(filters, initialResult, loadAction);

  const hasFilters = Boolean(accountId || categoryId || merchant || nature);
  const clearFilters = () => {
    setAccountId(ALL);
    setCategoryId(ALL);
    setMerchant(ALL);
    setNature(ALL);
  };

  const accountOptions = [{ id: ALL, label: "Todas" }, ...accounts.map((a) => ({ id: String(a.id), label: a.name }))];
  const categoryOptions = [{ id: ALL, label: "Todas" }, ...categories.map((c) => ({ id: String(c.id), label: c.label ?? c.name }))];
  const merchantNames = result ? [...new Set([...(merchant ? [merchant] : []), ...result.merchantOptions, ...(result.unidentified ? [UNIDENTIFIED_FILTER] : [])])] : merchant ? [merchant] : [];
  const merchantOptions = [{ id: ALL, label: "Todos" }, ...merchantNames.map((name) => ({ id: name, label: name }))];
  const natureOptions = [{ id: ALL, label: "Todos" }, ...SPENDING_NATURES.map((n) => ({ id: n, label: SPENDING_NATURE_LABELS[n] }))];

  const customValue: DateRangeValue = preset === "custom" && custom ? { start: custom.from, end: custom.to } : { start: null, end: null };

  const comparison = result?.comparison;
  const delta = comparison?.deltaExpenseCents ?? 0;
  const deltaTone = delta > 0 ? "text-danger" : delta < 0 ? "text-success" : "text-muted";

  return (
    <Card className="p-5">
      <Card.Header className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Card.Title>{title}</Card.Title>
            {description && <Card.Description>{description}</Card.Description>}
          </div>
          <SegmentedButtons options={VIEW_OPTIONS} value={view} onChange={setView} activeClassName={ACTIVE_ACCENT} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedButtons
            options={PRESET_OPTIONS}
            value={(preset === "custom" ? "" : preset) as Exclude<ExplorerPreset, "custom">}
            onChange={(value) => setPreset(value)}
            activeClassName={ACTIVE_NEUTRAL}
          />
          <DateRangeFilter
            value={customValue}
            onChange={(value) => {
              if (value.start && value.end) {
                setCustom({ from: value.start, to: value.end });
                setPreset("custom");
              } else setPreset(initialPreset);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Cuenta" options={accountOptions} value={accountId} onChange={setAccountId} />
          <FilterSelect label="Categoría" options={categoryOptions} value={categoryId} onChange={setCategoryId} />
          <FilterSelect label="Comercio" options={merchantOptions} value={merchant} onChange={setMerchant} />
          <FilterSelect label="Tipo de gasto" options={natureOptions} value={nature} onChange={setNature} />
          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" isIconOnly aria-label="Limpiar filtros" onPress={clearFilters}>
              <Icon icon={FunnelXmark} />
            </Button>
          )}
        </div>
      </Card.Header>

      <Card.Content className={`flex flex-col gap-4 transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`} aria-busy={isLoading}>
        {hasFailed || !result || !comparison ? (
          <Text tone="muted">No se pudo cargar esta vista. Revisa el rango de fechas e inténtalo de nuevo.</Text>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-x-8 gap-y-2" data-testid="explorer-summary">
              <div>
                <Text size="xs" tone="muted">
                  Gastos · {rangeLabel(result.from, result.to)}
                </Text>
                <p className="text-2xl font-semibold tabular-nums">{formatPesos(result.expenseCents)}</p>
              </div>
              {!nature && (
                <div>
                  <Text size="xs" tone="muted">
                    Ingresos
                  </Text>
                  <p className="text-2xl font-semibold tabular-nums">{formatPesos(result.incomeCents)}</p>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium tabular-nums ${deltaTone}`}>
                  {delta === 0 ? "Igual que el periodo anterior" : `${signedPesos(delta)}${comparison.deltaExpensePct != null ? ` (${formatSignedPercent(comparison.deltaExpensePct)})` : ""} contra el periodo anterior`}
                </p>
                <Text size="xs" tone="muted">
                  {rangeLabel(comparison.from, comparison.to)}: {formatPesos(comparison.expenseCents)}
                </Text>
              </div>
            </div>

            {comparison.drivers.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-label="Qué explica el cambio">
                <Text size="xs" tone="muted">
                  Lo que más cambió:
                </Text>
                {comparison.drivers.map((driver) => (
                  <button
                    key={driver.name}
                    type="button"
                    disabled={driver.categoryId == null}
                    onClick={() => driver.categoryId != null && (setCategoryId(String(driver.categoryId)), setView("category"))}
                    className="rounded-full border border-separator px-2.5 py-1 text-xs tabular-nums hover:bg-separator disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    {driver.name} <span className={driver.deltaCents > 0 ? "text-danger" : "text-success"}>{signedPesos(driver.deltaCents)}</span>
                  </button>
                ))}
              </div>
            )}

            {view === "flow" && <ExplorerFlowChart series={result.series} bucket={result.bucket} showIncome={!nature} />}
            {view === "category" && (
              <>
                {result.drillParent && (
                  <Text size="xs" tone="muted">
                    Subcategorías de {result.drillParent.name}.{" "}
                    <button type="button" className="text-accent hover:underline" onClick={() => setCategoryId(ALL)}>
                      Ver todas las categorías
                    </button>
                  </Text>
                )}
                <ExplorerBreakdown
                  title="Gasto por categoría"
                  shares={result.byCategory}
                  selectLabel={(share) => `Filtrar por ${share.name}`}
                  onSelect={(share) => share.categoryId != null && setCategoryId(String(share.categoryId))}
                />
              </>
            )}
            {view === "merchant" && (
              <ExplorerBreakdown
                title="Gasto por comercio"
                shares={result.byMerchant}
                selectLabel={(share) => `Filtrar por ${share.name}`}
                onSelect={(share) => setMerchant(share.name)}
                footer={result.unidentified ? `Sin comercio identificado: ${formatPesos(result.unidentified.totalCents)} en ${result.unidentified.count} movimientos (incluye pagos a personas y descripciones libres).` : undefined}
              />
            )}
            {view === "balance" && (
              <>
                <LineEvolutionChart series={result.balance.map((p) => ({ date: p.date, value: p.balanceCents }))} dateGranularity="daily" emptyMessage="Sin saldo que mostrar en este rango." tableCaption="Saldo" />
                <Text size="xs" tone="muted">
                  El saldo solo usa el filtro de cuenta (sin cuenta: tus cuentas líquidas).
                </Text>
              </>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}
