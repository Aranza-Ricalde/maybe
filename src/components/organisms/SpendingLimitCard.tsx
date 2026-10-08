import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/domain/shared/routes";
import type { SpendingPace } from "@/domain/dashboard/pace";
import { formatCurrency, formatDateRange } from "@/lib/format";
import { spendingLimitView } from "@/lib/presenters/dashboard";

export function SpendingLimitCard({ pace, range }: { pace: SpendingPace | null; range: { from: string; to: string } }) {
  const { budgetCents: budget, spentCents: spent, remainingCents: remaining, barValue, over } = spendingLimitView(pace);

  return (
    <Card aria-label="Límite mensual de gasto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Límite de gasto del periodo</CardTitle>
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <ShieldCheck className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {budget > 0 ? (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Presupuesto</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {formatCurrency(budget)} <span className="text-sm font-normal text-muted-foreground">MXN</span>
              </p>
            </div>
            <Progress value={barValue} variant={over ? "destructive" : "default"} aria-label="Gasto contra presupuesto" className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Gastado</p>
                <p className="font-semibold tabular-nums">{formatCurrency(spent)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{remaining >= 0 ? "Restante" : "Excedido"}</p>
                <p className={`font-semibold tabular-nums ${remaining >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(Math.abs(remaining))}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{formatDateRange(range.from, range.to)}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no tienes presupuesto para este periodo.{" "}
            <Link href={ROUTES.budgets} className="font-medium text-foreground underline underline-offset-4">
              Crear presupuesto
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
