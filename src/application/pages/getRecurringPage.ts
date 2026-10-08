import { categoryOptionsWithHierarchy } from "@/domain/categories/rules";
import type { AccountsReader, CategoriesReader, InboxReader, PlanningReader } from "@/domain/readModels/ports";
import { pendingBudgetDecisionViews } from "@/domain/recurring/budgetInclusion";
import { summarizeRecurring } from "@/domain/recurring/summary";
import { inferPayrollSetup, PAYROLL_NAME, suggestedMonthlyDay } from "@/domain/recurring/payroll";
import type { PayPeriodRecord } from "@/domain/payPeriod/ports";

export class GetRecurringPageUseCase {
  constructor(
    private readonly planning: PlanningReader,
    private readonly inbox: InboxReader,
    private readonly accounts: AccountsReader,
    private readonly categories: CategoriesReader,
    private readonly listPeriods: (familyId: number, today: string) => Promise<PayPeriodRecord[]>,
  ) {}

  async execute(familyId: number, today: string) {
    const [rows, candidates, accounts, categories, budgetPolicy, periods] = await Promise.all([
      this.planning.recurringItems(familyId),
      this.inbox.pendingRecurringCandidates(familyId),
      this.accounts.listActive(familyId),
      this.categories.list(familyId),
      this.planning.budgetPolicy(familyId),
      this.listPeriods(familyId, today),
    ]);

    return {
      rows,
      summary: summarizeRecurring(rows),
      payroll: {
        setup: inferPayrollSetup(rows),
        periods: periods.map(({ start, end }) => ({ start, end })),
        suggestedMonthlyDay: suggestedMonthlyDay(periods, today),
        today,
        categoryId: categories.find((category) => category.name === PAYROLL_NAME)?.id ?? null,
      },
      candidates,
      accounts,
      categories: categoryOptionsWithHierarchy(categories),
      budgetPolicy,
      pendingBudgetDecisions: pendingBudgetDecisionViews(rows, budgetPolicy, new Map(categories.map((category) => [category.id, category.name]))),
    };
  }
}
