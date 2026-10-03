import { Card } from "@heroui/react";
import Link from "next/link";
import type { getRecentTransactions } from "@/app/lib/queries";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { EmptyState } from "@/components/molecules/EmptyState";
import { amountSignTone, formatDate } from "@/lib/format";

type RecentTransaction = Awaited<ReturnType<typeof getRecentTransactions>>[number];

export function RecentActivityCard({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <Card className="p-5">
      <Card.Header className="flex items-center justify-between">
        <Card.Title>Actividad reciente</Card.Title>
        <Link href="/transactions" className="text-xs text-accent hover:underline">
          Ver todos →
        </Link>
      </Card.Header>
      <Card.Content>
        {transactions.length === 0 ? (
          <EmptyState title="Sin movimientos todavía" description="Registra tu primer movimiento desde Cuentas o Telegram." />
        ) : (
          <ul className="flex flex-col divide-y divide-separator">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <Text size="xs" tone="muted">
                    {formatDate(t.date)} · {t.accountName}
                    {t.categoryName ? ` · ${t.categoryName}` : ""}
                  </Text>
                </div>
                <CurrencyText cents={t.amountCents} withSign weight="medium" tone={amountSignTone(t.amountCents)} />
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}
