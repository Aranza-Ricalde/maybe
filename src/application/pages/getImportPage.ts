import { categoryOptionsWithHierarchy } from "@/domain/categories/rules";
import type { AccountsReader, CategoriesReader } from "@/domain/readModels/ports";

export class GetImportPageUseCase {
  constructor(
    private readonly accounts: AccountsReader,
    private readonly categories: CategoriesReader,
  ) {}

  async execute(familyId: number) {
    const [accounts, categories] = await Promise.all([this.accounts.listActive(familyId), this.categories.list(familyId)]);
    return {
      accounts: accounts.map(({ id, name }) => ({ id, name })),
      categories: categoryOptionsWithHierarchy(categories).map(({ id, name, label }) => ({ id, name, label })),
    };
  }
}
