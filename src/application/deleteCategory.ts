import type { CategoriesRepository } from "@/domain/categories/ports";

export class DeleteCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.deleteWithBudgetLines(id);
  }
}
