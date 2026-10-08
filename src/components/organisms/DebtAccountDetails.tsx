import { Text } from "@/components/atoms/Text";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import type { DebtAccountOverview } from "@/application/getDebtOverview";
import { formatPesos, formatShortDate } from "@/lib/format";

export function DebtAccountDetails({ debt }: { debt: DebtAccountOverview }) {
  const { terms } = debt;
  const hasTerms = terms.annualRatePct != null || terms.minimumPaymentCents != null || terms.paymentDueDay != null;
  const messages = debt.payoffs.filter((payoff) => payoff.message);

  return (
    <section className="flex flex-col gap-1.5 border-t pt-4" aria-label="Detalle de la deuda">
      <EyebrowLabel>Deuda</EyebrowLabel>
      {terms.annualRatePct != null && (
        <Text size="sm">
          Tasa {terms.annualRatePct}% anual{debt.monthlyInterestCents != null && ` · unos ${formatPesos(debt.monthlyInterestCents)} de interés al mes`}
        </Text>
      )}
      {(terms.minimumPaymentCents != null || debt.nextDueDate) && (
        <Text size="sm">
          {terms.minimumPaymentCents != null && `Pago mínimo ${formatPesos(terms.minimumPaymentCents)}`}
          {terms.minimumPaymentCents != null && debt.nextDueDate && " · "}
          {debt.nextDueDate && `vence el ${formatShortDate(debt.nextDueDate)}`}
        </Text>
      )}
      <Text size="sm" tone="muted">
        {debt.avgMonthlyPaymentCents > 0 ? `Pagos recientes: ${formatPesos(debt.avgMonthlyPaymentCents)} al mes (promedio de 90 días)` : "Sin pagos en los últimos 90 días"}
      </Text>
      {debt.interestPaid12mCents > 0 && (
        <Text size="sm" tone="muted">
          Interés registrado en 12 meses: {formatPesos(debt.interestPaid12mCents)}
        </Text>
      )}
      {messages.map((payoff) => (
        <Text key={payoff.label} size="sm" tone={payoff.projection.status === "never" ? "danger" : "default"}>
          {payoff.message}
        </Text>
      ))}
      {!hasTerms && (
        <Text size="sm" tone="muted">
          Edita la cuenta para agregar su tasa, pago mínimo y día de pago y estimar el interés y la fecha de liquidación.
        </Text>
      )}
    </section>
  );
}
