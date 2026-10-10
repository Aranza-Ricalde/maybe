import { CircleCheck, TriangleAlert, Wallet } from "lucide-react";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { Card, CardContent } from "@/components/ui/card";
import type { AvailableToSpendExplained, RunwayResult } from "@/domain/dashboard/rules";
import { formatCurrency } from "@/lib/format";
import { DisclosureRow } from "@/components/molecules/DisclosureRow";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { AvailableToSpendDetailBody, AvailableToSpendDetailModal } from "./AvailableToSpendDetailModal";

export interface AvailableToSpendCardProps {
  availableCents: number;
  upcomingCommitmentsCents: number;
  runway: RunwayResult;
  detail: AvailableToSpendExplained;
}

const TONE: Record<RunwayResult["level"], string> = {
  green: "bg-success/10 text-success",
  yellow: "bg-warning/15 text-warning",
  red: "bg-danger/10 text-danger",
};

const ICON_TONE: Record<RunwayResult["level"], string> = { green: "text-success", yellow: "text-warning", red: "text-danger" };

function commitmentsLine(upcomingCommitmentsCents: number): string {
  if (upcomingCommitmentsCents === 0) return "No tienes compromisos próximos registrados todavía.";
  if (upcomingCommitmentsCents < 0) return `Incluye ${formatCurrency(upcomingCommitmentsCents)} en compromisos próximos (recurrentes y pagos programados).`;
  return `Incluye ${formatCurrency(upcomingCommitmentsCents)} en ingresos próximos esperados.`;
}

export function AvailableToSpendCard({ availableCents, upcomingCommitmentsCents, runway, detail }: AvailableToSpendCardProps) {
  const StatusIcon = runway.level === "green" ? CircleCheck : TriangleAlert;
  return (
    <Card aria-label="Disponible para gastar">
      <CardContent className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wallet className="size-6" aria-hidden />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              Disponible para gastar
              <InfoTooltip label="Saldo en cuentas de débito y efectivo, menos tus próximos compromisos. No incluye tarjetas de crédito." />
            </p>
            <p className={`text-4xl font-semibold tracking-tight tabular-nums md:text-5xl ${availableCents < 0 ? "text-danger" : ""}`}>{formatCurrency(availableCents)}</p>
          </div>
        </div>
        <ResponsiveDialog title="Disponible para gastar" trigger={<DisclosureRow icon={StatusIcon} iconClassName={ICON_TONE[runway.level]} label={runway.message} className="md:hidden" />}>
          <div className="flex flex-col gap-5">
            <AvailableToSpendDetailBody detail={detail} />
          </div>
        </ResponsiveDialog>
        <div className="flex w-full items-start gap-3 max-md:hidden lg:w-auto lg:max-w-md">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${TONE[runway.level]}`}>
            <StatusIcon className="size-4" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm leading-snug font-semibold">{runway.message}</p>
            <p className="text-sm leading-snug text-muted-foreground">{commitmentsLine(upcomingCommitmentsCents)}</p>
            <div className="mt-1">
              <AvailableToSpendDetailModal detail={detail} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
