import { Button, Card } from "@heroui/react";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { DEFAULT_PROJECTION_MONTHS, type ProjectionBase, type ProjectionResult, type ScenarioAdjustment } from "@/domain/projection/rules";
import type { useScenarioBuilder } from "@/hooks/useScenarioBuilder";
import { formatPesos } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

const KINDS = [
  { value: "cut_category", label: "Recortar una categoría" },
  { value: "cut_discretionary", label: "Recortar todo lo discrecional" },
  { value: "monthly_change", label: "Gasto o ingreso nuevo cada mes" },
  { value: "one_time", label: "Gasto o ingreso de una sola vez" },
  { value: "allocate_debt", label: "Pagar deuda extra" },
  { value: "allocate_savings", label: "Ahorrar extra" },
];
const DIRECTIONS = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
];
const REPEAT_OPTIONS = [
  { value: "monthly", label: "Cada mes" },
  { value: "once", label: "Una sola vez" },
];
const MONTH_OPTIONS = Array.from({ length: DEFAULT_PROJECTION_MONTHS }, (_, i) => ({ value: String(i + 1), label: i === 0 ? "El mes siguiente" : `En ${i + 1} meses` }));

function describe(a: ScenarioAdjustment, categoryName: (id: number) => string): string {
  switch (a.kind) {
    case "cut_category":
      return `Recortar ${categoryName(a.categoryId)} ${a.percent}%`;
    case "cut_discretionary":
      return `Recortar lo discrecional ${a.percent}%`;
    case "monthly_change":
      return `${a.amountCents < 0 ? "Gasto" : "Ingreso"} de ${formatPesos(Math.abs(a.amountCents))} al mes desde el mes ${a.fromMonth}`;
    case "one_time":
      return `${a.amountCents < 0 ? "Gasto" : "Ingreso"} único de ${formatPesos(Math.abs(a.amountCents))} en el mes ${a.month}`;
    case "allocate":
      return `${a.target === "debt" ? "Pagar" : "Ahorrar"} ${formatPesos(a.amountCents)} extra ${a.repeat ? `cada mes desde el mes ${a.fromMonth}` : `una sola vez en el mes ${a.fromMonth}`}${a.target === "debt" ? " de deuda" : ""}`;
  }
}

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
    <Card className="min-w-0 p-5">
      <Card.Header>
        <Card.Title>Simula una decisión</Card.Title>
        <Card.Description>Prueba un cambio y mira cuánto mueve tu saldo. No se guarda ni cambia tus datos.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
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
          <Button size="sm" variant="primary" isDisabled={!canAdd} onPress={add}>
            Agregar al escenario
          </Button>
        </div>

        {entries.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-separator pt-4">
            <ul className="flex flex-col gap-1.5">
              {entries.map(({ id, adjustment }) => (
                <li key={id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-secondary px-3 py-2 text-sm">
                  <span>{describe(adjustment, categoryName)}</span>
                  <Button size="sm" variant="ghost" aria-label={`Quitar: ${describe(adjustment, categoryName)}`} onPress={() => remove(id)}>
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
              <p className="text-xs text-muted">
                {[result.allocatedToDebtCents > 0 && `${formatPesos(result.allocatedToDebtCents)} irían a pagar deuda`, result.allocatedToSavingsCents > 0 && `${formatPesos(result.allocatedToSavingsCents)} a tus ahorros`].filter(Boolean).join(" y ")}. Ese dinero sigue siendo tuyo: sale de tu saldo líquido, pero tu patrimonio no baja.
              </p>
            )}
            <div>
              <Button size="sm" variant="ghost" onPress={clear}>
                Limpiar escenario
              </Button>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
