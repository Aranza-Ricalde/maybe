import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { DEFAULT_PROJECTION_MONTHS, type ProjectionBase, type ProjectionResult } from "@/domain/projection/rules";
import type { useScenarioBuilder } from "@/hooks/useScenarioBuilder";
import { DIRECTIONS, KINDS, MONTH_OPTIONS, REPEAT_OPTIONS, describeAdjustment } from "@/lib/presenters/projectionScenario";
import { formatPesos } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

export interface ProjectionScenarioFormProps {
  base: ProjectionBase;
  builder: ReturnType<typeof useScenarioBuilder>;
  result: ProjectionResult;
}

export function ProjectionScenarioForm({ base, builder, result }: ProjectionScenarioFormProps) {
  const { values, setValue, needs, canAdd, add, remove, clear, entries } = builder;
  const categoryName = (id: number) => base.categories.find((c) => c.id === id)?.name ?? "categoría";
  const last = result.months[result.months.length - 1];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Simula una decisión</CardTitle>
        <CardDescription>Prueba un cambio y mira cuánto mueve tu saldo. No se guarda ni cambia tus datos.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
          <SelectField label="¿Qué pasa si…?" options={KINDS} value={values.kind} onChange={(v) => setValue("kind", v)} />
          {values.kind === "cut_category" && (
            <SelectField
              label="Categoría"
              options={base.categories.map((c) => ({ value: String(c.id), label: `${c.name} (${formatPesos(c.avgMonthlyCents)}/mes)` }))}
              value={values.categoryId}
              onChange={(v) => setValue("categoryId", v)}
            />
          )}
          {needs.needsPercent && <TextInput label="Recorte (%)" name={FIELD.percent} type="number" min="1" max="100" value={values.percent} onChange={(v) => setValue("percent", v)} />}
          {needs.needsAmount && (
            <>
              {needs.isAllocation ? (
                <SelectField label="Frecuencia" options={REPEAT_OPTIONS} value={values.repeat} onChange={(v) => setValue("repeat", v)} />
              ) : (
                <SelectField label="Tipo" options={DIRECTIONS} value={values.direction} onChange={(v) => setValue("direction", v)} />
              )}
              <TextInput label="Monto (pesos)" name={FIELD.amount} type="number" min="0" value={values.amount} onChange={(v) => setValue("amount", v)} />
              <SelectField
                label={values.kind === "monthly_change" || (needs.isAllocation && values.repeat === "monthly") ? "Desde" : "Cuándo"}
                options={MONTH_OPTIONS}
                value={values.month}
                onChange={(v) => setValue("month", v)}
              />
            </>
          )}
        </div>
        <div>
          <Button type="button" size="sm" disabled={!canAdd} onClick={add}>
            Agregar al escenario
          </Button>
        </div>

        {entries.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <ul className="flex flex-col gap-1.5">
              {entries.map(({ id, adjustment }) => (
                <li key={id} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
                  <span>{describeAdjustment(adjustment, categoryName)}</span>
                  <Button type="button" size="sm" variant="ghost" aria-label={`Quitar: ${describeAdjustment(adjustment, categoryName)}`} onClick={() => remove(id)}>
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-sm">
              Con este escenario tu saldo líquido {result.scenarioMonthlyNetCents >= 0 ? "crece" : "baja"} <span className="font-semibold">{formatPesos(Math.abs(result.scenarioMonthlyNetCents))}</span> al mes
              {last && <> y en {DEFAULT_PROJECTION_MONTHS} meses tendrías <span className="font-semibold">{formatPesos(result.finalScenarioCents)}</span> de saldo líquido</>}.
            </p>
            {(result.allocatedToDebtCents > 0 || result.allocatedToSavingsCents > 0) && (
              <p className="text-xs text-muted-foreground">
                {[result.allocatedToDebtCents > 0 && `${formatPesos(result.allocatedToDebtCents)} irían a pagar deuda`, result.allocatedToSavingsCents > 0 && `${formatPesos(result.allocatedToSavingsCents)} a tus ahorros`].filter(Boolean).join(" y ")}. Ese dinero sigue siendo tuyo: sale de tu saldo líquido, pero tu patrimonio no baja.
              </p>
            )}
            <div>
              <Button type="button" size="sm" variant="ghost" onClick={clear}>
                Limpiar escenario
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
