import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentTransactionView } from "@/components/viewModels";
import { ROUTES } from "@/domain/shared/routes";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { initialsOf } from "@/lib/presenters/breadcrumb";
import { cn } from "@/lib/utils";

export function RecentMovementsCard({ movements }: { movements: RecentTransactionView[] }) {
  if (movements.length === 0) return null;

  return (
    <Card aria-label="Últimos movimientos">
      <CardHeader>
        <CardTitle>Últimos movimientos</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={ROUTES.transactions} />}>
            Ver todos
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_7rem_6rem] gap-4 border-b px-6 pb-2 text-xs font-medium tracking-[0.07em] text-muted-foreground uppercase sm:grid">
          <span>Movimiento</span>
          <span>Cuenta</span>
          <span className="text-right">Monto</span>
          <span className="text-right">Fecha</span>
        </div>
        <ul className="flex flex-col">
          {movements.map((movement) => (
            <li key={movement.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b px-6 py-3 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_7rem_6rem]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">{initialsOf(movement.name)}</span>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium break-words">{movement.name}</p>
                  {movement.categoryName && <span className="mt-0.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{movement.categoryName}</span>}
                </div>
              </div>
              <span className="hidden text-sm text-muted-foreground sm:line-clamp-2 sm:block">{movement.accountName}</span>
              <span className={cn("text-right text-sm font-semibold tabular-nums", movement.amountCents > 0 && "text-success")}>{movement.amountCents > 0 ? "+" : ""}{formatCurrency(movement.amountCents)}</span>
              <span className="hidden text-right text-sm text-muted-foreground sm:block">{formatShortDate(movement.date)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
