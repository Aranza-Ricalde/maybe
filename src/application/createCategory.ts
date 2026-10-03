import type { CategoriesRepository, NewCategoryInput } from "@/domain/categories/ports";
import { assertValidCategoryClassification, assertValidCategoryName } from "@/domain/categories/rules";

export class CreateCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(input: NewCategoryInput): Promise<void> {
    assertValidCategoryName(input.name);
    assertValidCategoryClassification(input.classification);
    await this.repo.create(input);
  }
}
