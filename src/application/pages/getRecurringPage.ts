import { categoryOptionsWithHierarchy } from "@/domain/categories/rules";
import type { AccountsReader, CategoriesReader, InboxReader, PlanningReader } from "@/domain/readModels/ports";
import { pendingBudgetDecisionViews } from "@/domain/recurring/budgetInclusion";

export class GetRecurringPageUseCase {
  constructor(
    private readonly planning: PlanningReader,
    private readonly inbox: InboxReader,
    private readonly accounts: AccountsReader,
    private readonly categories: CategoriesReader,
  ) {}

  async execute(familyId: number) {
    const [rows, candidates, accounts, categories, budgetPolicy] = await Promise.all([
      this.planning.recurringItems(familyId),
      this.inbox.pendingRecurringCandidates(familyId),
      this.accounts.listActive(familyId),
      this.categories.list(familyId),
      this.planning.budgetPolicy(familyId),
    ]);

    return {
      rows,
      candidates,
      accounts,
      categories: categoryOptionsWithHierarchy(categories),
      budgetPolicy,
      pendingBudgetDecisions: pendingBudgetDecisionViews(rows, budgetPolicy, new Map(categories.map((category) => [category.id, category.name]))),
    };
  }
}
