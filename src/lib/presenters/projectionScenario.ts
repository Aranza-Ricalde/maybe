import { DEFAULT_PROJECTION_MONTHS, type ScenarioAdjustment } from "@/domain/projection/rules";
import { formatPesos } from "@/lib/format";

export const KINDS = [
  { value: "cut_category", label: "Recortar una categoría" },
  { value: "cut_discretionary", label: "Recortar todo lo discrecional" },
  { value: "monthly_change", label: "Gasto o ingreso nuevo cada mes" },
  { value: "one_time", label: "Gasto o ingreso de una sola vez" },
  { value: "allocate_debt", label: "Pagar deuda extra" },
  { value: "allocate_savings", label: "Ahorrar extra" },
];
export const DIRECTIONS = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
];
export const REPEAT_OPTIONS = [
  { value: "monthly", label: "Cada mes" },
  { value: "once", label: "Una sola vez" },
];
export const MONTH_OPTIONS = Array.from({ length: DEFAULT_PROJECTION_MONTHS }, (_, i) => ({ value: String(i + 1), label: i === 0 ? "El mes siguiente" : `En ${i + 1} meses` }));

export function describeAdjustment(a: ScenarioAdjustment, categoryName: (id: number) => string): string {
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
