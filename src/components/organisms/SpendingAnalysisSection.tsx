import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import { ProgressListRow } from "@/components/molecules/ProgressListRow";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import type { SpendingAnalysisView } from "@/application/getSpendingAnalysis";
import { SMALL_EXPENSE_MAX_CENTS } from "@/domain/spendingAnalysis/rules";
import { formatMonthYear, formatPercent, formatPesos } from "@/lib/format";

export function SpendingAnalysisSection({ analysis }: { analysis: SpendingAnalysisView }) {
  const { small, merchants, subscriptions, monthsAnalyzed } = analysis;
  const topMerchant = merchants[0];
  if (!small && !subscriptions && merchants.length === 0) return null;

  return (
    <>
      <StatBlockRow>
        <StatBlock
          label="Gastos pequeños"
          value={small ? formatPesos(small.totalCents) : "—"}
          tooltip={`Gastos de hasta ${formatPesos(SMALL_EXPENSE_MAX_CENTS)} cada uno, del último mes completo. Por separado parecen poco; juntos suman.`}
          hint={
            <div className="mt-1 flex flex-col gap-0.5">
              {small ? (
                <>
                  <Text size="xs" tone="muted">
                    {small.count} movimientos · {formatPercent(small.shareOfSpend)} de tu gasto de {formatMonthYear(small.month)}
                  </Text>
                  {small.previousTotalCents != null && (
                    <Text size="xs" tone="muted">
                      Mes anterior: {formatPesos(small.previousTotalCents)}
                    </Text>
                  )}
                </>
              ) : (
                <Text size="xs" tone="muted">
                  Sin gastos pequeños en el último mes completo
                </Text>
              )}
            </div>
          }
        />
        <StatBlock
          label="Suscripciones"
          value={subscriptions ? `${formatPesos(subscriptions.monthlyCents)} /mes` : "—"}
          tooltip="Lo que gastas al mes (promedio de los meses completos) en las categorías de suscripciones y streaming."
          hint={
            <div className="mt-1">
              <Text size="xs" tone="muted">
                {subscriptions ? `${subscriptions.services.length} ${subscriptions.services.length === 1 ? "servicio" : "servicios"} · ${formatPesos(subscriptions.yearlyCents)} al año` : "Sin gasto en categorías de suscripciones"}
              </Text>
            </div>
          }
        />
        <StatBlock
          label="Donde más se va"
          value={topMerchant ? <span className="block max-w-full truncate text-xl">{topMerchant.merchant}</span> : "—"}
          tooltip={`El comercio donde más dinero gastaste en los últimos ${monthsAnalyzed} meses completos.`}
          hint={
            topMerchant && (
              <div className="mt-1">
                <Text size="xs" tone="muted">
                  {formatPesos(topMerchant.totalCents)} · {formatPercent(topMerchant.shareOfSpend)} de tu gasto
                </Text>
              </div>
            )
          }
        />
      </StatBlockRow>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {small && (
          <Card className="p-5">
            <Card.Header>
              <Card.Title>Tus gastos pequeños, juntos</Card.Title>
              <Card.Description>
                {formatMonthYear(small.month)}: {small.count} movimientos de hasta {formatPesos(SMALL_EXPENSE_MAX_CENTS)} que suman {formatPesos(small.totalCents)}.
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              {small.groups.map((g) => (
                <ProgressListRow key={g.name} label={`${g.name} · ${g.count}`} value={formatPesos(g.totalCents)} percent={small.totalCents > 0 ? g.totalCents / small.totalCents : 0} />
              ))}
            </Card.Content>
          </Card>
        )}
        {merchants.length > 0 && (
          <Card className="p-5">
            <Card.Header>
              <Card.Title>Comercios que más consumen</Card.Title>
              <Card.Description>Últimos {monthsAnalyzed} meses completos, de mayor a menor.</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              {merchants.map((m) => (
                <ProgressListRow key={m.merchant} label={`${m.merchant} · ${m.count}`} value={formatPesos(m.totalCents)} percent={merchants[0].totalCents > 0 ? m.totalCents / merchants[0].totalCents : 0} />
              ))}
            </Card.Content>
          </Card>
        )}
      </div>

      {subscriptions && (
        <Card className="p-5">
          <Card.Header>
            <Card.Title>Tus suscripciones</Card.Title>
            <Card.Description>
              {formatPesos(subscriptions.monthlyCents)} al mes, {formatPesos(subscriptions.yearlyCents)} al año.
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            {subscriptions.services.map((s) => (
              <ProgressListRow key={s.merchant} label={s.merchant} value={`${formatPesos(s.monthlyCents)} /mes`} percent={subscriptions.monthlyCents > 0 ? s.monthlyCents / subscriptions.monthlyCents : 0} />
            ))}
          </Card.Content>
        </Card>
      )}
    </>
  );
}
