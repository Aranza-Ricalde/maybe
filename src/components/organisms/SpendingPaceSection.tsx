import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { SeriesLegend } from "@/components/molecules/SeriesLegend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SpendingPace } from "@/domain/dashboard/pace";
import { ROUTES } from "@/domain/shared/routes";
import { buildPaceChart, paceNotice } from "@/lib/presenters/dashboard";
import { TimeSeriesChart } from "./TimeSeriesChart";

const NOTICE = { danger: { variant: "destructive", Icon: CircleAlert }, warning: { variant: "warning", Icon: TriangleAlert }, success: { variant: "success", Icon: CircleCheck }, muted: { variant: "info", Icon: Info } } as const;

export function SpendingPaceSection({ pace }: { pace: SpendingPace }) {
  const chart = buildPaceChart(pace);
  const notice = paceNotice(pace);
  const { variant, Icon } = NOTICE[notice.tone];
  const legend = chart.series.map(({ key, label, color, dashed }) => ({ key, label, color, dashed }));

  return (
    <Card aria-label="Gasto del periodo contra tu presupuesto" className="h-full min-w-0">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Gasto del periodo contra tu presupuesto</CardTitle>
        <SeriesLegend items={legend} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
      <TimeSeriesChart model={chart} ariaLabel={`Gasto acumulado del periodo: ${notice.text}`} className="h-72" />
      <Alert variant={variant}>
        <Icon />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>{notice.text}</span>
          <Link href={ROUTES.budgets} className="font-medium underline">
            Ver presupuestos
          </Link>
        </AlertDescription>
      </Alert>
      </CardContent>
    </Card>
  );
}
