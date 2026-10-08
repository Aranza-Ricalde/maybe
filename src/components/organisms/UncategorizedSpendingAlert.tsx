import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UNCATEGORIZED_ID, type CategoryStats } from "@/domain/categoryStats/rules";
import { ROUTES } from "@/domain/shared/routes";
import { formatPercent, formatPesos } from "@/lib/format";

const UNCATEGORIZED_WARNING_SHARE = 0.05;

export function UncategorizedSpendingAlert({ stats }: { stats: CategoryStats }) {
  const uncategorized = stats.rows.find((row) => row.categoryId === UNCATEGORIZED_ID);
  if (!uncategorized || uncategorized.shareOfWindow < UNCATEGORIZED_WARNING_SHARE) return null;

  return (
    <Alert variant="warning">
      <TriangleAlert />
      <AlertTitle>
        {formatPesos(uncategorized.windowCents)} ({formatPercent(uncategorized.shareOfWindow)} de tu gasto) no tiene categoría
      </AlertTitle>
      <AlertDescription>
        Suelen ser pagos de tarjeta o transferencias propias registrados como gasto, lo que cuenta el mismo dinero dos veces. Revísalos en{" "}
        <Link href={ROUTES.transactions} className="font-medium underline">
          Movimientos
        </Link>{" "}
        para que estas cifras reflejen lo que de verdad gastas.
      </AlertDescription>
    </Alert>
  );
}
