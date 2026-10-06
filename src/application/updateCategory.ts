import type { CategoriesRepository, UpdateCategoryInput } from "@/domain/categories/ports";
import { assertValidSpendingNature } from "@/domain/categories/nature";
import {
  InvalidCategoryError,
  assertValidCategoryClassification,
  assertValidCategoryName,
  assertValidCategoryParent,
} from "@/domain/categories/rules";

export class UpdateCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(input: UpdateCategoryInput): Promise<void> {
    assertValidCategoryName(input.name);
    assertValidCategoryClassification(input.classification);
    assertValidSpendingNature(input.nature);

    const current = await this.repo.getHierarchyState(input.id);
    if (!current) throw new InvalidCategoryError("La categoría no existe.");

    const parentId = input.parentId === undefined ? current.parentId : input.parentId;
    const parent = parentId != null ? await this.repo.getHierarchyState(parentId) : null;
    assertValidCategoryParent({
      categoryId: input.id,
      familyId: current.familyId,
      classification: input.classification,
      parentId,
      parent,
      childClassifications: current.childClassifications,
    });

    await this.repo.update({ ...input, parentId });
  }
}
