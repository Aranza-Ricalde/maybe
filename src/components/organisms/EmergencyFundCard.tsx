import type { EmergencyFundView } from "@/application/getEmergencyFund";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPesos } from "@/lib/format";
import { coverageProgress } from "@/lib/presenters/budgets";

export function EmergencyFundCard({ emergencyFund }: { emergencyFund: EmergencyFundView }) {
  const target = emergencyFund.targetMonths;
  const months = emergencyFund.coverageMonths;
  const tooltip =
    emergencyFund.source === "goal"
      ? "Las cuentas de tu meta de fondo de emergencia entre tu gasto esencial mensual (las categorías que marcaste como esenciales)."
      : "Tus cuentas de ahorro entre tu gasto esencial mensual (las categorías que marcaste como esenciales).";

  return (
    <Card aria-label="Fondo de emergencia">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Fondo de emergencia
          <InfoTooltip label={tooltip} />
        </CardTitle>
        <CardDescription>
          {months == null ? "Marca tus categorías esenciales en Configuración para calcularlo" : `${emergencyFund.source === "goal" ? "Tu meta" : "Meta sugerida"}: ${Number.isInteger(target) ? target : target.toFixed(1)} meses`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{months == null ? "—" : `${months.toFixed(1)} meses`}</p>
        {months != null && (
          <>
            <Progress value={coverageProgress(months, target)} variant={emergencyFund.missingCents === 0 ? "success" : "default"} aria-label="Avance del fondo de emergencia" className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {formatPesos(emergencyFund.fundCents)} ahorrados · {emergencyFund.missingCents === 0 ? "meta cumplida" : `faltan ${formatPesos(emergencyFund.missingCents as number)}`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
