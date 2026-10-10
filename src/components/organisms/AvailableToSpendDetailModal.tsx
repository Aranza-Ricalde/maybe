import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { DetailModal } from "@/components/molecules/DetailModal";
import { SectionLabel } from "@/components/molecules/SectionLabel";
import type { AvailableToSpendExplained } from "@/domain/dashboard/rules";
import { formatCurrency, formatShortDate } from "@/lib/format";

export interface AvailableToSpendDetailModalProps {
  detail: AvailableToSpendExplained;
}

export function AvailableToSpendDetailBody({ detail }: AvailableToSpendDetailModalProps) {
  const { liquidAccounts, liquidBalanceCents, commitments, commitmentsCents, availableCents } = detail;

  return (
    <>
      <div className="rounded-xl bg-primary/5 p-4">
        <CurrencyText cents={availableCents} size="base" weight="semibold" tone={availableCents < 0 ? "danger" : "default"} className="text-2xl" />
        <Text size="xs" tone="muted" className="mt-1.5">
          {formatCurrency(liquidBalanceCents)} de saldo líquido {commitmentsCents >= 0 ? "+" : "−"} {formatCurrency(Math.abs(commitmentsCents))} en
          compromisos
        </Text>
      </div>

      {liquidAccounts.length > 0 && (
        <div>
          <SectionLabel>Saldo líquido por cuenta</SectionLabel>
          <ul className="flex flex-col divide-y divide-border">
            {liquidAccounts.map((a) => (
              <li key={a.name} className="flex items-center justify-between py-2.5 text-sm">
                <p className="font-medium text-foreground">{a.name}</p>
                <CurrencyText cents={a.balanceCents} tone="muted" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <SectionLabel>Compromisos conocidos</SectionLabel>
        {commitments.length === 0 ? (
          <Text size="sm" tone="muted">
            No tienes compromisos próximos registrados todavía.
          </Text>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {commitments.map((c, i) => (
              <li key={`${c.name}-${c.date}-${i}`} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <Text size="xs" tone="muted">
                    {formatShortDate(c.date)}
                  </Text>
                </div>
                <CurrencyText cents={c.amountCents} weight="semibold" tone={c.amountCents < 0 ? "danger" : "success"} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function AvailableToSpendDetailModal({ detail }: AvailableToSpendDetailModalProps) {
  return (
    <DetailModal title="Disponible para gastar" triggerClassName="max-md:hidden">
      <AvailableToSpendDetailBody detail={detail} />
    </DetailModal>
  );
}
