import { categoryOptionsWithHierarchy } from "@/domain/categories/rules";
import type { CategoryStatsReader } from "@/domain/categoryStats/ports";
import type { AccountsReader, CategoriesReader } from "@/domain/readModels/ports";
import type { StatsParams } from "@/domain/stats/params";
import type { GetProjectionBaseUseCase } from "../getProjectionBase";
import type { GetStatsUseCase } from "../getStats";

export class GetStatsPageUseCase {
  constructor(
    private readonly stats: GetStatsUseCase,
    private readonly categoryStats: CategoryStatsReader,
    private readonly projectionBase: GetProjectionBaseUseCase,
    private readonly accounts: AccountsReader,
    private readonly categories: CategoriesReader,
  ) {}

  async execute(familyId: number, params: StatsParams, today: string) {
    const [data, categoryStats, simulator, accounts, categories] = await Promise.all([
      this.stats.execute(familyId, params, today),
      this.categoryStats.execute(familyId, today),
      this.projectionBase.execute(familyId, today),
      this.accounts.listActive(familyId),
      this.categories.list(familyId),
    ]);
    const { basisMonths, assumptions, ...base } = simulator;

    return {
      today,
      data,
      categoryStats,
      simulator: { basisMonths, assumptions, base },
      options: {
        accounts: accounts.map(({ id, name }) => ({ id, name })),
        categories: categoryOptionsWithHierarchy(categories).map(({ id, name, label }) => ({ id, name, label })),
      },
    };
  }
}

export type StatsPageView = Awaited<ReturnType<GetStatsPageUseCase["execute"]>>;
