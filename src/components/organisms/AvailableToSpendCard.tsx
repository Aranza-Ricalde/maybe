import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { Text } from "@/components/atoms/Text";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { StatusDot } from "@/components/molecules/StatusDot";
import { STATUS_LEVEL_TO_BADGE_VARIANT } from "@/components/molecules/StatusTheme";
import { FinancialStatusBanner } from "./FinancialStatusBanner";
import { AvailableToSpendDetailModal } from "./AvailableToSpendDetailModal";
import type { AvailableToSpendExplained, FinancialStatusResult, RunwayResult } from "@/domain/dashboard/rules";
import { formatCurrency } from "@/lib/format";

function commitmentsLineFor(upcomingCommitmentsCents: number): string {
  if (upcomingCommitmentsCents === 0) return "No tienes compromisos próximos registrados todavía.";
  if (upcomingCommitmentsCents < 0) {
    return `Incluye ${formatCurrency(upcomingCommitmentsCents)} en compromisos próximos (recurrentes y pagos programados).`;
  }
  return `Incluye ${formatCurrency(upcomingCommitmentsCents)} en ingresos próximos esperados.`;
}

export interface AvailableToSpendCardProps {
  availableCents: number;
  upcomingCommitmentsCents: number;
  runway: RunwayResult;
  detail: AvailableToSpendExplained;
  status: FinancialStatusResult;
}

export function AvailableToSpendCard({ availableCents, upcomingCommitmentsCents, runway, detail, status }: AvailableToSpendCardProps) {
  return (
    <Card className="border-primary/15 bg-primary/5">
      <CardContent>
      <div className="flex items-center gap-1.5">
        <EyebrowLabel>Disponible para gastar</EyebrowLabel>
        <InfoTooltip label="Saldo en cuentas de débito y efectivo, menos tus próximos compromisos. No incluye tarjetas de crédito." />
      </div>
      <CurrencyText cents={availableCents} size="base" weight="semibold" tone={availableCents < 0 ? "danger" : "default"} className="mt-2 text-4xl" />
      <Text size="sm" tone="muted" className="mt-1.5">
        {commitmentsLineFor(upcomingCommitmentsCents)}
      </Text>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <Badge variant={STATUS_LEVEL_TO_BADGE_VARIANT[runway.level]} className="h-auto max-w-full whitespace-normal px-2.5 py-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <StatusDot level={runway.level} />
            {runway.message}
          </span>
        </Badge>
        <AvailableToSpendDetailModal detail={detail} />
      </div>
      {status.level !== "green" && (
        <div className="mt-4">
          <FinancialStatusBanner status={status} />
        </div>
      )}
      </CardContent>
    </Card>
  );
}
