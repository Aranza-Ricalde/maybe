import type { BalanceReader, AccountSnapshotReader } from "@/domain/dashboard/ports";
import type { ExplorerRepository } from "@/domain/explorer/ports";
import { assertValidExplorerRange, bucketFor, composeExplorer, previousRange, type ExplorerFilters, type ExplorerResult } from "@/domain/explorer/rules";
import type { CategoriesReader } from "@/domain/readModels/ports";

export class GetExplorerUseCase {
  constructor(
    private readonly repo: ExplorerRepository,
    private readonly categories: CategoriesReader,
    private readonly dashboard: AccountSnapshotReader & BalanceReader,
  ) {}

  async execute(familyId: number, filters: ExplorerFilters, today: string): Promise<ExplorerResult> {
    assertValidExplorerRange(filters.from, filters.to);
    const bucket = bucketFor(filters.from, filters.to);
    const previous = previousRange(filters.from, filters.to);

    const [currentRows, previousRows, categories, accountIds] = await Promise.all([
      this.repo.aggregate(familyId, filters.from, filters.to, bucket, filters.accountId),
      this.repo.aggregate(familyId, previous.from, previous.to, bucket, filters.accountId),
      this.categories.list(familyId),
      filters.accountId != null ? Promise.resolve([filters.accountId]) : this.dashboard.getLiquidAccounts(familyId, today).then((accounts) => accounts.map((a) => a.accountId)),
    ]);

    const balance = accountIds.length > 0 ? await this.dashboard.getDailyBalanceSeries(accountIds, filters.from, filters.to < today ? filters.to : today) : [];
    return composeExplorer({
      filters,
      bucket,
      currentRows,
      previousRows,
      categories: categories.map((c) => ({ id: c.id, parentId: c.parentId, name: c.name, color: c.color, spendingNature: c.spendingNature })),
      balance,
    });
  }
}
