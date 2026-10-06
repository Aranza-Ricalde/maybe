import type { CategoriesRepository, NewCategoryInput } from "@/domain/categories/ports";
import { assertValidSpendingNature } from "@/domain/categories/nature";
import { assertValidCategoryClassification, assertValidCategoryName, assertValidCategoryParent } from "@/domain/categories/rules";

export class CreateCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(input: NewCategoryInput): Promise<void> {
    assertValidCategoryName(input.name);
    assertValidCategoryClassification(input.classification);
    assertValidSpendingNature(input.nature);

    const parentId = input.parentId ?? null;
    const parent = parentId != null ? await this.repo.getHierarchyState(parentId) : null;
    assertValidCategoryParent({
      familyId: input.familyId,
      classification: input.classification,
      parentId,
      parent,
      childClassifications: [],
    });

    await this.repo.create({ ...input, parentId });
  }
}
