import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { DetailModal } from "@/components/molecules/DetailModal";

export interface GastosBreakdownItem {
  name: string;
  spentCents: number;
}

export interface GastosBreakdownModalProps {
  breakdown: GastosBreakdownItem[];
  totalExpenseCents: number;
}

export function GastosBreakdownModal({ breakdown, totalExpenseCents }: GastosBreakdownModalProps) {
  if (breakdown.length === 0) return null;

  return (
    <DetailModal title="Desglose de gastos" triggerLabel="Ver de qué se compone Gastos →">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted uppercase">
              <th className="pb-2 text-left font-medium">Categoría</th>
              <th className="pb-2 text-right font-medium">Gasto</th>
              <th className="pb-2 text-right font-medium">% del gasto del periodo</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((c) => (
              <tr key={c.name} className="border-t border-separator">
                <td className="py-2.5 font-medium text-foreground">{c.name}</td>
                <td className="py-2.5 text-right">
                  <CurrencyText cents={c.spentCents} />
                </td>
                <td className="py-2.5 text-right">
                  <Text tone="muted" className="tabular-nums">
                    {totalExpenseCents > 0 ? Math.round((c.spentCents / totalExpenseCents) * 100) : 0}%
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="rounded-lg bg-default/50 px-3 py-2.5 text-xs leading-relaxed text-muted">
        El % es sobre el total gastado este periodo, no sobre el presupuesto de cada categoría (eso se ve en &ldquo;Presupuesto por categorías&rdquo;).
      </p>
    </DetailModal>
  );
}
