import Link from "next/link";
import { Text } from "@/components/atoms/Text";
import { endOfMonth } from "@/domain/cashflow/rules";
import { UNCATEGORIZED_ID, UNKNOWN_CATEGORY_ID, type CategoryStatRow, type CategoryStats } from "@/domain/categoryStats/rules";
import { formatMonthYearShort, formatPesos, formatSignedPercent } from "@/lib/format";
import { transactionsDrilldownHref } from "@/domain/shared/routes";

const CELL = "px-3 py-2.5 text-right tabular-nums whitespace-nowrap";

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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="text-xs text-muted uppercase">
            <th className="px-3 pb-2 text-left font-medium">Categoría</th>
            {stats.months.map((m) => (
              <th key={m} className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                {formatMonthYearShort(m)}
                {m === stats.currentMonth && <span className="block text-[10px] font-normal normal-case">en curso</span>}
              </th>
            ))}
            <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">Prom. 3 meses</th>
            <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">Último mes vs anterior</th>
            <th className="px-3 pb-2 text-right font-medium">% del gasto</th>
          </tr>
        </thead>
        <tbody>
          {stats.rows.map((row) => {
            const isSub = row.depth === 1;
            const href = transactionsHref(row.categoryId, windowStart, lastDay);
            return (
              <tr key={`${row.parentId ?? "root"}-${row.categoryId}`} className={`border-t border-separator ${isSub ? "text-muted" : ""}`}>
                <td className={`px-3 py-2.5 ${isSub ? "pl-8" : "font-medium text-foreground"}`}>
                  {href ? (
                    <Link href={href} className="hover:text-accent hover:underline">
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )}
                </td>
                {row.seriesCents.map((cents, i) => {
                  const month = stats.months[i];
                  const monthHref = cents !== 0 ? transactionsHref(row.categoryId, month, endOfMonth(month)) : null;
                  return (
                    <td key={month} className={`${CELL} ${month === stats.currentMonth ? "text-muted" : ""}`}>
                      {cents === 0 ? (
                        <span className="text-muted">—</span>
                      ) : monthHref ? (
                        <Link href={monthHref} className="hover:text-accent hover:underline">
                          {formatPesos(cents)}
                        </Link>
                      ) : (
                        formatPesos(cents)
                      )}
                    </td>
                  );
                })}
                <td className={CELL}>{row.avgLast3Cents === 0 ? <span className="text-muted">—</span> : formatPesos(row.avgLast3Cents)}</td>
                <td className={CELL}>{deltaLabel(row)}</td>
                <td className={CELL}>{row.shareOfWindow > 0 ? `${(row.shareOfWindow * 100).toFixed(1)}%` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-separator font-semibold">
            <td className="px-3 py-2.5">Total</td>
            {stats.totals.seriesCents.map((cents, i) => (
              <td key={stats.months[i]} className={`${CELL} ${stats.months[i] === stats.currentMonth ? "text-muted" : ""}`}>
                {formatPesos(cents)}
              </td>
            ))}
            <td className={CELL}>{formatPesos(stats.totals.avgLast3Cents)}</td>
            <td className={CELL}>{deltaLabel(stats.totals)}</td>
            <td className={CELL}>100%</td>
          </tr>
        </tfoot>
      </table>
      <Text size="xs" tone="muted" className="mt-3 block">
        Las subcategorías (con sangría) ya están incluidas en el total de su categoría principal. El mes en curso se muestra, pero no entra en promedios ni en la
        comparación, porque está incompleto. Haz clic en una categoría o en un monto para ver los movimientos que lo componen.
      </Text>
    </div>
  );
}
