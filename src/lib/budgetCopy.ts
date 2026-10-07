import type { BudgetOrigin } from "@/domain/budget/overview";
import type { ResolvedCategoryDescription } from "@/domain/categories/descriptions";
import { formatCurrency } from "./format";

export function describeBudgetOrigin(origin: BudgetOrigin): string | null {
  switch (origin.kind) {
    case "none":
      return null;
    case "manual":
      return `Tú fijaste ${formatCurrency(origin.amountCents)} ${origin.cadence === "monthly" ? "al mes" : "por quincena"} para esta categoría.`;
    case "recurring":
      return "No fijaste un presupuesto: es la suma de tus pagos recurrentes de esta categoría.";
    case "children":
      return "Es la suma de los presupuestos de sus subcategorías.";
    case "raised":
      return `Tu tope era ${formatCurrency(origin.ownCapCents)}, pero sus subcategorías suman más, así que se usa esa suma.`;
    case "cap":
      return `Tope que fijaste: ${formatCurrency(origin.amountCents)} ${origin.cadence === "monthly" ? "al mes" : "por quincena"}.${origin.unallocatedCents > 0 ? ` Te quedan ${formatCurrency(origin.unallocatedCents)} sin asignar a subcategorías.` : ""}`;
  }
}

export function describeCategory(name: string, description: ResolvedCategoryDescription): string {
  return description.text ?? `Aún no tiene descripción. Agrégala en Configuración → Categorías → ${name} para recordar qué va aquí.`;
}
