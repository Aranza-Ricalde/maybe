import { requireUser } from "@/app/lib/dal";
import { SpendingPageTemplate } from "@/components/templates/SpendingPageTemplate";
import { getCategoryStatsUseCase, getSpendingAnalysisUseCase, getTrendsUseCase } from "@/infrastructure/container";
import { todayIso } from "@/lib/today";

export default async function SpendingPage() {
  const user = await requireUser();
  const today = todayIso();
  const [stats, analysis, trends] = await Promise.all([
    getCategoryStatsUseCase.execute(user.familyId, today),
    getSpendingAnalysisUseCase.execute(user.familyId, today),
    getTrendsUseCase.execute(user.familyId, today),
  ]);

  return <SpendingPageTemplate stats={stats} analysis={analysis} trends={trends} />;
}
