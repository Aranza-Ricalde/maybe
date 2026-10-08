import { requireUser } from "@/app/lib/dal";
import { StatsPageTemplate } from "@/components/templates/StatsPageTemplate";
import { InvalidExplorerFiltersError } from "@/domain/explorer/rules";
import { DEFAULT_STATS_PARAMS, parseStatsParams, type RawStatsParams } from "@/domain/stats/params";
import { getStatsPageUseCase } from "@/infrastructure/container";
import { todayIso } from "@/lib/today";
import { loadStatsAction, setMinimumBalance } from "./actions";

async function loadPage(familyId: number, raw: RawStatsParams) {
  const requested = parseStatsParams(raw);
  try {
    return { params: requested, page: await getStatsPageUseCase.execute(familyId, requested, todayIso()) };
  } catch (error) {
    if (!(error instanceof InvalidExplorerFiltersError)) throw error;
    return { params: DEFAULT_STATS_PARAMS, page: await getStatsPageUseCase.execute(familyId, DEFAULT_STATS_PARAMS, todayIso()) };
  }
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<RawStatsParams> }) {
  const user = await requireUser();
  const { params, page } = await loadPage(user.familyId, await searchParams);

  return <StatsPageTemplate initialParams={params} page={page} loadAction={loadStatsAction} minimumAction={setMinimumBalance} />;
}
