import { Card } from "@heroui/react";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import type { NatureStatRow } from "@/domain/categoryStats/rules";
import { formatPercent, formatPesos } from "@/lib/format";

const BAR_COLOR: Record<string, string> = {
  essential: "bg-accent",
  discretionary: "bg-warning",
  none: "bg-separator",
};

export function NatureBreakdownCard({ natures }: { natures: NatureStatRow[] }) {
  const classified = natures.some((n) => n.nature != null);
  if (natures.length === 0) return null;

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Esencial vs. discrecional</Card.Title>
        <Card.Description>
          {classified
            ? "Cómo se reparte tu gasto de los meses completos entre lo que tienes que pagar y lo que eliges gastar."
            : "Marca cada categoría como esencial o discrecional en Configuración para ver dónde puedes recortar."}
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-secondary" role="img" aria-label="Reparto del gasto por naturaleza">
          {natures.map((n) => (
            <span key={n.nature ?? "none"} className={BAR_COLOR[n.nature ?? "none"]} style={{ width: `${n.shareOfWindow * 100}%` }} />
          ))}
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {natures.map((n) => (
            <li key={n.nature ?? "none"} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${BAR_COLOR[n.nature ?? "none"]}`} />
                <EyebrowLabel>{n.label}</EyebrowLabel>
              </div>
              <p className="text-lg font-semibold tabular-nums">{formatPesos(n.avgLast3Cents)}<span className="text-xs font-normal text-muted"> /mes</span></p>
              <p className="text-xs text-muted">{formatPercent(n.shareOfWindow)} del gasto · {formatPesos(n.windowCents)} en total</p>
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
  );
}
