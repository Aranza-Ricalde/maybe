import { Card } from "@heroui/react";
import Link from "next/link";
import type { SpendingAnalysisView } from "@/application/getSpendingAnalysis";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { CategoryStatsTable } from "@/components/organisms/CategoryStatsTable";
import { ExplorerCard } from "@/components/organisms/ExplorerCard";
import { NatureBreakdownCard } from "@/components/organisms/NatureBreakdownCard";
import { SpendingAnalysisSection } from "@/components/organisms/SpendingAnalysisSection";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { discretionaryActions } from "@/domain/categoryStats/opportunities";
import { UNCATEGORIZED_ID, type CategoryStats } from "@/domain/categoryStats/rules";
import type { PresetRange } from "@/domain/explorer/presets";
import type { ExplorerResult } from "@/domain/explorer/rules";
import { ROUTES } from "@/domain/shared/routes";
import { formatPercent, formatPesos } from "@/lib/format";

const UNCATEGORIZED_WARNING_SHARE = 0.05;

export interface SpendingPageTemplateProps {
  stats: CategoryStats;
  analysis: SpendingAnalysisView;
  explorer: { today: string; currentPeriod: PresetRange; initialResult: ExplorerResult; accounts: AccountOption[]; categories: CategoryOption[] };
  loadExplorerAction: (args: unknown) => Promise<ExplorerResult | null>;
  mergeSubscriptionsAction: (formData: FormData) => void;
  dissolveSubscriptionAction: (formData: FormData) => void;
}

export function SpendingPageTemplate({ stats, analysis, explorer, loadExplorerAction, mergeSubscriptionsAction, dissolveSubscriptionAction }: SpendingPageTemplateProps) {
  const uncategorized = stats.rows.find((r) => r.categoryId === UNCATEGORIZED_ID);
  const showWarning = uncategorized != null && uncategorized.shareOfWindow >= UNCATEGORIZED_WARNING_SHARE;

  return (
    <>
      <PageHeader title="Gasto por categoría" subtitle="Explora en qué se va tu dinero y qué cambió." />

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

      <ExplorerCard
        title="Explora tu gasto"
        description="Filtra por periodo, cuenta, categoría, comercio y tipo de gasto; abajo ves cuánto cambió y qué lo explica."
        initialView="category"
        initialPreset="3m"
        initialResult={explorer.initialResult}
        today={explorer.today}
        currentPeriod={explorer.currentPeriod}
        accounts={explorer.accounts}
        categories={explorer.categories}
        loadAction={loadExplorerAction}
      />

      <NatureBreakdownCard natures={stats.natures} actions={discretionaryActions(stats)} />

      <SpendingAnalysisSection analysis={analysis} mergeAction={mergeSubscriptionsAction} dissolveAction={dissolveSubscriptionAction} />

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
