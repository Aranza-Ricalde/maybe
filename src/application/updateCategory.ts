import type { CategoriesRepository, UpdateCategoryInput } from "@/domain/categories/ports";
import { assertValidCategoryClassification, assertValidCategoryName } from "@/domain/categories/rules";

export class UpdateCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(input: UpdateCategoryInput): Promise<void> {
    assertValidCategoryName(input.name);
    assertValidCategoryClassification(input.classification);
    await this.repo.update(input);
  }
}
