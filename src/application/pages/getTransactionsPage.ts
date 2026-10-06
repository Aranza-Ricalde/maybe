import { categoryOptionsWithHierarchy } from "@/domain/categories/rules";
import { parseTransactionDrilldown } from "@/domain/ledger/rules";
import type { CaptureRepository } from "@/domain/captures/ports";
import type { AccountsReader, CategoriesReader } from "@/domain/readModels/ports";
import type { TransactionsSearchParams } from "@/domain/shared/routes";
import type { GetTransferSuggestionsUseCase } from "../getTransferSuggestions";

export class GetTransactionsPageUseCase {
  constructor(
    private readonly accounts: AccountsReader,
    private readonly categories: CategoriesReader,
    private readonly suggestions: GetTransferSuggestionsUseCase,
    private readonly captures: Pick<CaptureRepository, "listPending">,
  ) {}

  async execute(familyId: number, today: string, searchParams: TransactionsSearchParams) {
    const drilldown = parseTransactionDrilldown(searchParams);
    const [accounts, categories, transferSuggestions, pendingCaptures] = await Promise.all([this.accounts.listActive(familyId), this.categories.list(familyId), this.suggestions.execute(familyId, today), this.captures.listPending(familyId)]);

    return {
      accounts,
      categories: categoryOptionsWithHierarchy(categories),
      today,
      transferSuggestions,
      pendingCaptures,
      initialFilters: {
        ...(drilldown.categoryId ? { categoryId: String(drilldown.categoryId) } : {}),
        ...(drilldown.from && drilldown.to ? { dateRange: { start: drilldown.from, end: drilldown.to } } : {}),
      },
    };
  }
}
