import { categoryOptionsWithHierarchy } from "@/domain/categories/rules";
import type { AccountsReader, CategoriesReader } from "@/domain/readModels/ports";
import { resolvePreset } from "@/domain/explorer/presets";
import type { CategoryStatsReader } from "@/domain/categoryStats/ports";
import type { GetExplorerUseCase } from "../getExplorer";
import type { GetSpendingAnalysisUseCase } from "../getSpendingAnalysis";
import type { ResolvePeriodContextUseCase } from "./resolvePeriodContext";

export const SPENDING_DEFAULT_PRESET = "3m";

export class GetSpendingPageUseCase {
  constructor(
    private readonly stats: CategoryStatsReader,
    private readonly analysis: GetSpendingAnalysisUseCase,
    private readonly explorer: GetExplorerUseCase,
    private readonly accounts: AccountsReader,
    private readonly categories: CategoriesReader,
    private readonly periods: ResolvePeriodContextUseCase,
  ) {}

  async execute(familyId: number, today: string) {
    const { displayPeriod } = await this.periods.execute(familyId, today, undefined);
    const currentPeriod = { from: displayPeriod.start, to: displayPeriod.end };
    const range = resolvePreset(SPENDING_DEFAULT_PRESET, today, currentPeriod, null);

    const [stats, analysis, initialResult, accounts, categories] = await Promise.all([
      this.stats.execute(familyId, today),
      this.analysis.execute(familyId, today),
      this.explorer.execute(familyId, { ...range, accountId: null, categoryId: null, merchant: null, nature: null }, today),
      this.accounts.listActive(familyId),
      this.categories.list(familyId),
    ]);

    return {
      stats,
      analysis,
      explorer: {
        today,
        currentPeriod,
        initialResult,
        accounts: accounts.map(({ id, name }) => ({ id, name })),
        categories: categoryOptionsWithHierarchy(categories).map(({ id, name, label }) => ({ id, name, label })),
      },
    };
  }
}
