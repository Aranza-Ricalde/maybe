import Link from "next/link";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ProgressListRow } from "@/components/molecules/ProgressListRow";
import { DetailModal } from "@/components/molecules/DetailModal";
import { SectionLabel } from "@/components/molecules/SectionLabel";
import { goalProgress } from "@/domain/dashboard/rules";
import { formatCurrency } from "@/lib/format";

export interface SavingsGoalInput {
  id: number;
  name: string;
  targetAmountCents: number;
  currentCents: number;
}

export interface SavingsGoalsModalProps {
  savingsTotalCents: number;
  goals: SavingsGoalInput[];
}

export function SavingsGoalsModal({ savingsTotalCents, goals }: SavingsGoalsModalProps) {
  if (goals.length === 0) return null;

  return (
    <DetailModal title="Ahorro y metas">
      <div className="rounded-xl bg-accent/5 p-4">
        <CurrencyText cents={savingsTotalCents} size="base" weight="semibold" className="text-2xl" />
        <Text size="xs" tone="muted" className="mt-1.5">
          Suma de todas tus cuentas de ahorro.
        </Text>
      </div>

      <div>
        <SectionLabel>Progreso por meta</SectionLabel>
        <div className="flex flex-col gap-4">
          {goals.map((g) => {
            const progress = goalProgress(g.currentCents, g.targetAmountCents);
            return (
              <ProgressListRow
                key={g.id}
                label={g.name}
                value={`${formatCurrency(progress.currentCents)} / ${formatCurrency(g.targetAmountCents)}`}
                percent={progress.percent}
              />
            );
          })}
        </div>
      </div>

      <Link href="/goals" className="text-sm text-accent hover:underline">
        Ver todas tus metas →
      </Link>
    </DetailModal>
  );
}
