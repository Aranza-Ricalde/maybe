import { budgetScopeNote, budgetTableRows, composeBudgetOverview } from "@/domain/budget/overview";
import { monthShareCovered } from "@/domain/budget/rules";
import type { CategoriesReader, PlanningReader } from "@/domain/readModels/ports";
import { pendingBudgetDecisionViews } from "@/domain/recurring/budgetInclusion";
import type { ResolvePeriodContextUseCase } from "./resolvePeriodContext";

export class GetBudgetsPageUseCase {
  constructor(
    private readonly periods: ResolvePeriodContextUseCase,
    private readonly categories: CategoriesReader,
    private readonly planning: PlanningReader,
  ) {}

  async execute(familyId: number, today: string, periodsParam: string | undefined) {
    const { selectedPeriods, displayPeriod, header } = await this.periods.execute(familyId, today, periodsParam);

    const [categories, settings, recurringItems, actuals, budgetPolicy] = await Promise.all([
      this.categories.list(familyId),
      this.planning.budgetSettings(familyId),
      this.planning.recurringItems(familyId),
      this.categories.expenseTotalsBetween(familyId, displayPeriod.start, displayPeriod.end),
      this.planning.budgetPolicy(familyId),
    ]);

    const { hierarchy } = composeBudgetOverview({ categories, settings, recurringItems, periods: selectedPeriods, actuals });

    return {
      rows: budgetTableRows(categories, settings, hierarchy),
      scopeNote: budgetScopeNote(monthShareCovered(selectedPeriods), selectedPeriods.length),
      ...header,
      pendingBudgetDecisions: pendingBudgetDecisionViews(recurringItems, budgetPolicy, new Map(categories.map((category) => [category.id, category.name]))),
      budgetPolicy,
    };
  }
}
