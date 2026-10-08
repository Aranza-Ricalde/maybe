import Link from "next/link";
import { Text } from "@/components/atoms/Text";
import { endOfMonth } from "@/domain/cashflow/rules";
import { UNCATEGORIZED_ID, UNKNOWN_CATEGORY_ID, type CategoryStatRow, type CategoryStats } from "@/domain/categoryStats/rules";
import { formatMonthYearShort, formatPesos, formatSignedPercent } from "@/lib/format";
import { transactionsDrilldownHref } from "@/domain/shared/routes";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CELL = "text-right tabular-nums";

function transactionsHref(categoryId: number, from: string, to: string): string | null {
  if (categoryId === UNCATEGORIZED_ID || categoryId === UNKNOWN_CATEGORY_ID) return null;
  return transactionsDrilldownHref(categoryId, from, to);
}

function deltaLabel(row: Pick<CategoryStatRow, "deltaCents" | "deltaPct" | "previousMonthCents" | "lastMonthCents">): string {
  if (row.previousMonthCents === 0 && row.lastMonthCents === 0) return "—";
  const sign = row.deltaCents > 0 ? "+" : row.deltaCents < 0 ? "−" : "";
  const amount = `${sign}${formatPesos(Math.abs(row.deltaCents))}`;
  return row.deltaPct == null ? amount : `${amount} (${formatSignedPercent(row.deltaPct)})`;
}

export function CategoryStatsTable({ stats }: { stats: CategoryStats }) {
  const lastDay = endOfMonth(stats.currentMonth);
  const windowStart = stats.completedMonths[0] ?? stats.months[0];

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-[760px] text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-card">Categoría</TableHead>
            {stats.months.map((m) => (
              <TableHead key={m} className="text-right">
                {formatMonthYearShort(m)}
                {m === stats.currentMonth && <span className="block text-[10px] font-normal normal-case">en curso</span>}
              </TableHead>
            ))}
            <TableHead className="text-right">Prom. 3 meses</TableHead>
            <TableHead className="text-right">Último mes vs anterior</TableHead>
            <TableHead className="text-right">% del gasto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.rows.map((row) => {
            const isSub = row.depth === 1;
            const href = transactionsHref(row.categoryId, windowStart, lastDay);
            return (
              <TableRow key={`${row.parentId ?? "root"}-${row.categoryId}`} className={isSub ? "text-muted-foreground" : undefined}>
                <TableCell className={`sticky left-0 z-10 bg-card ${isSub ? "pl-8 text-muted-foreground" : "font-medium"}`}>
                  {href ? (
                    <Link href={href} className="hover:text-primary hover:underline">
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )}
                </TableCell>
                {row.seriesCents.map((cents, i) => {
                  const month = stats.months[i];
                  const monthHref = cents !== 0 ? transactionsHref(row.categoryId, month, endOfMonth(month)) : null;
                  return (
                    <TableCell key={month} className={`${CELL} ${month === stats.currentMonth ? "text-muted-foreground" : ""}`}>
                      {cents === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : monthHref ? (
                        <Link href={monthHref} className="hover:text-primary hover:underline">
                          {formatPesos(cents)}
                        </Link>
                      ) : (
                        formatPesos(cents)
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className={CELL}>{row.avgLast3Cents === 0 ? <span className="text-muted-foreground">—</span> : formatPesos(row.avgLast3Cents)}</TableCell>
                <TableCell className={`${CELL} ${row.deltaCents > 0 ? "text-danger" : row.deltaCents < 0 ? "text-success" : ""}`}>{deltaLabel(row)}</TableCell>
                <TableCell className={CELL}>{row.shareOfWindow > 0 ? `${(row.shareOfWindow * 100).toFixed(1)}%` : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="sticky left-0 z-10 bg-muted font-semibold">Total</TableCell>
            {stats.totals.seriesCents.map((cents, i) => (
              <TableCell key={stats.months[i]} className={`${CELL} ${stats.months[i] === stats.currentMonth ? "text-muted-foreground" : ""}`}>
                {formatPesos(cents)}
              </TableCell>
            ))}
            <TableCell className={CELL}>{formatPesos(stats.totals.avgLast3Cents)}</TableCell>
            <TableCell className={CELL}>{deltaLabel(stats.totals)}</TableCell>
            <TableCell className={CELL}>100%</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <Text size="xs" tone="muted" className="mt-3 block">
        Las subcategorías (con sangría) ya están incluidas en el total de su categoría principal. El mes en curso se muestra, pero no entra en promedios ni en la
        comparación, porque está incompleto. Haz clic en una categoría o en un monto para ver los movimientos que lo componen.
      </Text>
    </div>
  );
}
