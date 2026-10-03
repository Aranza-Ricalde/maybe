import Link from "next/link";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ProgressListRow } from "@/components/molecules/ProgressListRow";
import { DetailModal } from "@/components/molecules/DetailModal";
import { SectionLabel } from "@/components/molecules/SectionLabel";
import { formatCurrency } from "@/lib/format";

export interface DebtAccountInput {
  name: string;
  balanceCents: number;
}

export interface DebtDetailModalProps {
  totalCents: number;
  paidThisPeriodCents: number;
  overallPercentPaid: number;
  accounts: DebtAccountInput[];
}

export function DebtDetailModal({ totalCents, paidThisPeriodCents, overallPercentPaid, accounts }: DebtDetailModalProps) {
  if (totalCents === 0) return null;

  const sorted = [...accounts].sort((a, b) => Math.abs(b.balanceCents) - Math.abs(a.balanceCents));
  const maxBalanceCents = Math.max(...sorted.map((a) => Math.abs(a.balanceCents)), 1);

  return (
    <DetailModal title="Deudas">
      <div className="rounded-xl bg-danger/5 p-4">
        <CurrencyText cents={totalCents} absolute size="base" weight="semibold" tone="danger" className="text-2xl" />
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-separator">
          <div className="h-full rounded-full bg-accent" style={{ width: `${overallPercentPaid * 100}%` }} />
        </div>
        <Text size="xs" tone="muted" className="mt-1.5">
          {Math.round(overallPercentPaid * 100)}% pagado en total
        </Text>
        {paidThisPeriodCents > 0 && (
          <Text size="xs" tone="success" className="mt-1">
            Has pagado {formatCurrency(paidThisPeriodCents)} este periodo.
          </Text>
        )}
      </div>

      {sorted.length > 0 && (
        <div>
          <SectionLabel>Por cuenta</SectionLabel>
          <div className="flex flex-col gap-4">
            {sorted.map((a) => (
              <ProgressListRow
                key={a.name}
                label={a.name}
                value={formatCurrency(Math.abs(a.balanceCents))}
                percent={Math.abs(a.balanceCents) / maxBalanceCents}
                barColor="var(--danger)"
              />
            ))}
          </div>
        </div>
      )}

      <Link href="/accounts" className="text-sm text-accent hover:underline">
        Ver todas tus cuentas →
      </Link>
    </DetailModal>
  );
}
