import { Info } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROUTES } from "@/domain/shared/routes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import type { DiscretionaryActions } from "@/domain/categoryStats/opportunities";
import type { NatureStatRow } from "@/domain/categoryStats/rules";
import { formatPercent, formatPesos } from "@/lib/format";

const BAR_COLOR: Record<string, string> = {
  essential: "bg-primary",
  discretionary: "bg-warning",
  none: "bg-muted",
};

export function NatureBreakdownCard({ natures, actions }: { natures: NatureStatRow[]; actions: DiscretionaryActions | null }) {
  const classified = natures.some((n) => n.nature != null);
  if (natures.length === 0) return null;

  if (!classified) {
    return (
      <Alert variant="info">
        <Info />
        <AlertTitle>Esencial vs. discrecional</AlertTitle>
        <AlertDescription>
          Marca cada categoría como esencial o discrecional en{" "}
          <Link href={ROUTES.settings} className="font-medium underline">
            Configuración
          </Link>{" "}
          para ver dónde puedes recortar.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Esencial vs. discrecional</CardTitle>
        <CardDescription>Cómo se reparte tu gasto de los meses completos entre lo que tienes que pagar y lo que eliges gastar.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Reparto del gasto por naturaleza">
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
              <p className="text-lg font-semibold tabular-nums">{formatPesos(n.avgLast3Cents)}<span className="text-xs font-normal text-muted-foreground"> /mes</span></p>
              <p className="text-xs text-muted-foreground">{formatPercent(n.shareOfWindow)} del gasto · {formatPesos(n.windowCents)} en total</p>
            </li>
          ))}
        </ul>
        {actions && (
          <div className="rounded-lg border border-border p-3" data-testid="discretionary-actions">
            <p className="text-sm font-medium">
              Si recortas {actions.cutPercent} % de lo discrecional ahorrarías {formatPesos(actions.monthlySavingCents)} al mes ({formatPesos(actions.yearlySavingCents)} al año).
            </p>
            {actions.opportunities.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Donde más puedes recortar:{" "}
                {actions.opportunities.map((o, index) => (
                  <span key={o.categoryId}>
                    {index > 0 && " · "}
                    <span className="font-medium text-foreground">{o.name}</span> {formatPesos(o.discretionaryMonthlyCents)}/mes
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
