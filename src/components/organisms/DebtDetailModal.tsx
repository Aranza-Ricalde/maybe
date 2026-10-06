import Link from "next/link";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ProgressListRow } from "@/components/molecules/ProgressListRow";
import { DetailModal } from "@/components/molecules/DetailModal";
import { SectionLabel } from "@/components/molecules/SectionLabel";
import type { DebtAccountOverview } from "@/application/getDebtOverview";
import { formatCurrency, formatPercent, formatPesos, formatShortDate } from "@/lib/format";
import { ROUTES } from "@/domain/shared/routes";

export type DebtAccountInput = DebtAccountOverview;

export interface DebtDetailModalProps {
  totalCents: number;
  paidThisPeriodCents: number;
  overallPercentPaid: number;
  accounts: DebtAccountInput[];
}

export function DebtDetailModal({ totalCents, paidThisPeriodCents, overallPercentPaid, accounts }: DebtDetailModalProps) {
  if (totalCents === 0) return null;

  const maxBalanceCents = Math.max(...accounts.map((a) => a.owedCents), 1);

  return (
    <DetailModal title="Deudas">
      <div className="rounded-xl bg-danger/5 p-4">
        <CurrencyText cents={totalCents} absolute size="base" weight="semibold" tone="danger" className="text-2xl" />
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-separator">
          <div className="h-full rounded-full bg-accent" style={{ width: `${overallPercentPaid * 100}%` }} />
        </div>
        <Text size="xs" tone="muted" className="mt-1.5">
          {formatPercent(overallPercentPaid)} de la deuda reducido desde su primer registro
        </Text>
        {paidThisPeriodCents > 0 && (
          <Text size="xs" tone="success" className="mt-1">
            Has pagado {formatCurrency(paidThisPeriodCents)} este periodo.
          </Text>
        )}
      </div>

      {accounts.length > 0 && (
        <div>
          <SectionLabel>Por cuenta</SectionLabel>
          <div className="flex flex-col gap-4">
            {accounts.map((a) => {
              const hasTerms = a.terms.annualRatePct != null || a.terms.minimumPaymentCents != null || a.terms.paymentDueDay != null;
              return (
                <div key={a.id}>
                  <ProgressListRow label={a.name} value={formatCurrency(a.owedCents)} percent={a.owedCents / maxBalanceCents} barColor="var(--danger)" />
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    {a.terms.annualRatePct != null && (
                      <Text size="xs" tone="muted">
                        Tasa {a.terms.annualRatePct}% anual{a.monthlyInterestCents != null && ` · unos ${formatPesos(a.monthlyInterestCents)} de interés al mes`}
                      </Text>
                    )}
                    {(a.terms.minimumPaymentCents != null || a.nextDueDate) && (
                      <Text size="xs" tone="muted">
                        {a.terms.minimumPaymentCents != null && `Pago mínimo ${formatPesos(a.terms.minimumPaymentCents)}`}
                        {a.terms.minimumPaymentCents != null && a.nextDueDate && " · "}
                        {a.nextDueDate && `vence el ${formatShortDate(a.nextDueDate)}`}
                      </Text>
                    )}
                    <Text size="xs" tone="muted">
                      {a.avgMonthlyPaymentCents > 0 ? `Pagos recientes: ${formatPesos(a.avgMonthlyPaymentCents)} al mes (promedio de 90 días)` : "Sin pagos en los últimos 90 días"}
                    </Text>
                    {a.interestPaid12mCents > 0 && (
                      <Text size="xs" tone="muted">
                        Interés registrado en 12 meses: {formatPesos(a.interestPaid12mCents)}
                      </Text>
                    )}
                    {a.payoffs.map((p) => p.message && (
                      <Text key={p.label} size="xs" tone={p.projection.status === "never" ? "danger" : "default"}>
                        {p.message}
                      </Text>
                    ))}
                    {!hasTerms && (
                      <Text size="xs" tone="muted">
                        Agrega su tasa, pago mínimo y día de pago en Cuentas para estimar el interés y la fecha de liquidación.
                      </Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link href={ROUTES.accounts} className="text-sm text-accent hover:underline">
        Ver todas tus cuentas →
      </Link>
    </DetailModal>
  );
}
