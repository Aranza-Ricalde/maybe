import { categoryOptionsWithHierarchy } from "@/domain/categories/rules";
import type { AccountsReader, CategoriesReader } from "@/domain/readModels/ports";
import type { StatementInboxRepository } from "@/domain/statements/inbox";

export class GetImportPageUseCase {
  constructor(
    private readonly accounts: AccountsReader,
    private readonly categories: CategoriesReader,
    private readonly inbox: Pick<StatementInboxRepository, "listPending">,
  ) {}

  async execute(familyId: number) {
    const [accounts, categories, pending] = await Promise.all([this.accounts.listActive(familyId), this.categories.list(familyId), this.inbox.listPending(familyId)]);
    const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
    return {
      accounts: accounts.map(({ id, name }) => ({ id, name })),
      pendingStatements: pending.map((statement) => ({ ...statement, accountName: accountNames.get(statement.accountId) ?? "Cuenta" })),
      categories: categoryOptionsWithHierarchy(categories).map(({ id, name, label }) => ({ id, name, label })),
    };
  }
}
