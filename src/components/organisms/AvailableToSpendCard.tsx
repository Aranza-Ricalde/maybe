import { Card } from "@heroui/react";
import { Chip } from "@/components/atoms/Chip";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { Text } from "@/components/atoms/Text";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { StatusDot } from "@/components/molecules/StatusDot";
import { STATUS_LEVEL_TO_CHIP_TONE } from "@/components/molecules/StatusTheme";
import { AvailableToSpendDetailModal } from "./AvailableToSpendDetailModal";
import type { AvailableToSpendExplained, RunwayResult } from "@/domain/dashboard/rules";
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
}

export function AvailableToSpendCard({ availableCents, upcomingCommitmentsCents, runway, detail }: AvailableToSpendCardProps) {
  return (
    <Card className="border border-accent/15 bg-accent/5 p-6">
      <div className="flex items-center gap-1.5">
        <EyebrowLabel>Disponible para gastar</EyebrowLabel>
        <InfoTooltip label="Saldo en cuentas de débito y efectivo, menos tus próximos compromisos. No incluye tarjetas de crédito." />
      </div>
      <CurrencyText cents={availableCents} size="base" weight="semibold" tone={availableCents < 0 ? "danger" : "default"} className="mt-2 text-4xl" />
      <Text size="sm" tone="muted" className="mt-1.5">
        {commitmentsLineFor(upcomingCommitmentsCents)}
      </Text>
      <div className="mt-3 flex items-center justify-between">
        <Chip tone={STATUS_LEVEL_TO_CHIP_TONE[runway.level]} size="md">
          <span className="inline-flex items-center gap-2">
            <StatusDot level={runway.level} />
            {runway.message}
          </span>
        </Chip>
        <AvailableToSpendDetailModal detail={detail} />
      </div>
    </Card>
  );
}
