"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { FilterPanel } from "@/components/molecules/FilterPanel";
import { PeriodPicker } from "@/components/molecules/PeriodPicker";
import { SegmentedButtons } from "@/components/molecules/SegmentedButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useExplorer, type UseExplorerOptions } from "@/hooks/useExplorer";
import { formatDateRange, formatPesos, formatSignedPesos } from "@/lib/format";
import { EXPLORER_PRESET_OPTIONS, EXPLORER_VIEW_OPTIONS } from "@/lib/presenters/explorer";
import { ExplorerBreakdown } from "./ExplorerBreakdown";
import { ExpenseWaterfallChart } from "./ExpenseWaterfallChart";
import { ExplorerFlowChart } from "./ExplorerFlowChart";
import { LineEvolutionChart } from "./LineEvolutionChart";

export type ExplorerCardProps = UseExplorerOptions & { title: string; description?: string };

const DELTA_BADGE = { up: "destructive", down: "success", flat: "secondary" } as const;

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text size="xs" tone="muted">
        {label}
      </Text>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function ExplorerCard({ title, description, ...options }: ExplorerCardProps) {
  const explorer = useExplorer(options);
  const { view, setView, preset, setPreset, range, custom, chooseCustomRange, values, setValue, clearFilters, drillIntoCategory, selectCategory, clearCategory, selectMerchant, result, isLoading, hasFailed, delta, waterfall } = explorer;
  const comparison = result?.comparison;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 basis-full sm:basis-auto">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <SegmentedButtons options={EXPLORER_VIEW_OPTIONS} value={view} onChange={setView} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker
            presets={EXPLORER_PRESET_OPTIONS}
            value={preset}
            isCustom={preset === "custom"}
            customLabel={formatDateRange(range.from, range.to)}
            customRange={custom ? { start: custom.from, end: custom.to } : null}
            onPresetChange={(value) => setPreset(value as typeof preset)}
            onCustomChange={(value) => chooseCustomRange({ from: value.start, to: value.end })}
          />
          <FilterPanel
            onClear={clearFilters}
            groups={[
              { key: "account", label: "Cuenta", options: explorer.options.accounts, value: values.accountId, onChange: setValue("accountId") },
              { key: "category", label: "Categoría", options: explorer.options.categories, value: values.categoryId, onChange: setValue("categoryId") },
              { key: "merchant", label: "Comercio", options: explorer.options.merchants, value: values.merchant, onChange: setValue("merchant") },
              { key: "nature", label: "Tipo de gasto", options: explorer.options.natures, value: values.nature, onChange: setValue("nature") },
            ]}
          />
        </div>
      </CardHeader>

      <CardContent className={`flex flex-col gap-4 transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`} aria-busy={isLoading}>
        {hasFailed || !result || !comparison || !delta ? (
          <Text tone="muted">No se pudo cargar esta vista. Revisa el rango de fechas e inténtalo de nuevo.</Text>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-[auto_auto_1fr] sm:items-end sm:gap-8" data-testid="explorer-summary">
              <Metric label={`Gastos · ${formatDateRange(result.from, result.to)}`} value={formatPesos(result.expenseCents)} />
              {!values.nature && <Metric label="Ingresos" value={formatPesos(result.incomeCents)} />}
              <div className="flex flex-col gap-1 sm:items-end sm:text-right">
                <Badge variant={DELTA_BADGE[delta.tone]} className="h-6 w-fit gap-1 px-2 text-sm tabular-nums">
                  {delta.tone !== "flat" && <Icon icon={delta.tone === "up" ? TrendingUp : TrendingDown} size="sm" />}
                  {delta.label}
                </Badge>
                <Text size="xs" tone="muted">
                  contra el periodo anterior · {formatDateRange(comparison.from, comparison.to)}: {formatPesos(comparison.expenseCents)}
                </Text>
              </div>
            </div>

            {comparison.drivers.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-label="Qué explica el cambio">
                <Text size="xs" tone="muted">
                  Lo que más cambió:
                </Text>
                {comparison.drivers.map((driver) => (
                  <Button
                    key={driver.name}
                    type="button"
                    variant="outline"
                    size="xs"
                    className="rounded-full tabular-nums"
                    disabled={driver.categoryId == null}
                    onClick={() => driver.categoryId != null && drillIntoCategory(driver.categoryId)}
                  >
                    {driver.name} <span className={driver.deltaCents > 0 ? "text-danger" : "text-success"}>{formatSignedPesos(driver.deltaCents)}</span>
                  </Button>
                ))}
              </div>
            )}

            {view === "flow" && <ExplorerFlowChart series={result.series} bucket={result.bucket} showIncome={!values.nature} />}
            {view === "category" && (
              <>
                {result.drillParent && (
                  <Text size="xs" tone="muted">
                    Subcategorías de {result.drillParent.name}.{" "}
                    <Button type="button" variant="link" size="xs" className="h-auto p-0" onClick={clearCategory}>
                      Ver todas las categorías
                    </Button>
                  </Text>
                )}
                <ExplorerBreakdown title="Gasto por categoría" shares={result.byCategory} selectLabel={(share) => `Filtrar por ${share.name}`} onSelect={(share) => share.categoryId != null && selectCategory(share.categoryId)} />
              </>
            )}
            {view === "merchant" && (
              <ExplorerBreakdown
                title="Gasto por comercio"
                shares={result.byMerchant}
                selectLabel={(share) => `Filtrar por ${share.name}`}
                onSelect={(share) => selectMerchant(share.name)}
                footer={result.unidentified ? `Sin comercio identificado: ${formatPesos(result.unidentified.totalCents)} en ${result.unidentified.count} movimientos (incluye pagos a personas y descripciones libres).` : undefined}
              />
            )}
            {view === "change" && (
              <>
                {waterfall.length > 2 ? <ExpenseWaterfallChart steps={waterfall} /> : <Text tone="muted">No hay cambios que mostrar frente al periodo anterior.</Text>}
                <Text size="xs" tone="muted">
                  De izquierda a derecha: lo que gastabas antes, lo que subió o bajó en cada categoría y lo que gastas ahora.
                </Text>
              </>
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
      </CardContent>
    </Card>
  );
}
