import { Card } from "@heroui/react";
import Link from "next/link";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { CategoryStatsTable } from "@/components/organisms/CategoryStatsTable";
import { TrendsCard } from "@/components/organisms/TrendsCard";
import type { TrendSummary } from "@/domain/trends/rules";
import { ChangeExplanationCard } from "@/components/organisms/ChangeExplanationCard";
import type { SpendingAnalysisView } from "@/application/getSpendingAnalysis";
import { SpendingAnalysisSection } from "@/components/organisms/SpendingAnalysisSection";
import { NatureBreakdownCard } from "@/components/organisms/NatureBreakdownCard";
import { explainChange } from "@/domain/categoryStats/explain";
import { UNCATEGORIZED_ID, type CategoryStats } from "@/domain/categoryStats/rules";
import { formatPercent, formatPesos } from "@/lib/format";
import { ROUTES } from "@/domain/shared/routes";

const UNCATEGORIZED_WARNING_SHARE = 0.05;

export function SpendingPageTemplate({ stats, analysis, trends }: { stats: CategoryStats; analysis: SpendingAnalysisView; trends: TrendSummary | null }) {
  const uncategorized = stats.rows.find((r) => r.categoryId === UNCATEGORIZED_ID);
  const showWarning = uncategorized != null && uncategorized.shareOfWindow >= UNCATEGORIZED_WARNING_SHARE;

  return (
    <>
      <PageHeader title="Gasto por categoría" subtitle="Cuánto gastas en cada categoría y subcategoría, mes con mes." />

      {showWarning && uncategorized && (
        <Card className="border border-warning/40 p-4">
          <p className="text-sm font-medium">
            {formatPesos(uncategorized.windowCents)} ({formatPercent(uncategorized.shareOfWindow)} de tu gasto) no tiene categoría.
          </p>
          <p className="mt-1 text-sm text-muted">
            Suelen ser pagos de tarjeta o transferencias propias registrados como gasto, lo que cuenta el mismo dinero dos veces. Revísalos en{" "}
            <Link href={ROUTES.transactions} className="text-accent hover:underline">
              Movimientos
            </Link>{" "}
            para que estas cifras reflejen lo que de verdad gastas.
          </p>
        </Card>
      )}

      <TrendsCard trends={trends} />

      <ChangeExplanationCard explanation={explainChange(stats)} />

      <NatureBreakdownCard natures={stats.natures} />

      <SpendingAnalysisSection analysis={analysis} />

      <Card className="p-5">
        {stats.rows.length === 0 ? (
          <EmptyState title="Todavía no hay gasto que analizar" description="Registra movimientos y aquí verás cuánto gastas en cada categoría." />
        ) : (
          <CategoryStatsTable stats={stats} />
        )}
      </Card>
    </>
  );
}
