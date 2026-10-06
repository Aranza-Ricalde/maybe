import { eq } from "drizzle-orm";
import type {
  CategoriesRepository,
  CategoryHierarchyState,
  CategoryRecord,
  NewCategoryInput,
  UpdateCategoryInput,
} from "@/domain/categories/ports";
import { db } from "./client";
import { categories } from "./schema/classification";

export class DrizzleCategoriesRepository implements CategoriesRepository {
  async getById(id: number): Promise<CategoryRecord | null> {
    const [row] = await db.select({ id: categories.id, familyId: categories.familyId }).from(categories).where(eq(categories.id, id));
    return row ?? null;
  }

  async getHierarchyState(id: number): Promise<CategoryHierarchyState | null> {
    const [row] = await db
      .select({ id: categories.id, familyId: categories.familyId, parentId: categories.parentId, classification: categories.classification })
      .from(categories)
      .where(eq(categories.id, id));
    if (!row) return null;
    const children = await db.select({ classification: categories.classification }).from(categories).where(eq(categories.parentId, id));
    return { ...row, childClassifications: children.map((c) => c.classification) };
  }

  async create(input: NewCategoryInput & { parentId: number | null }): Promise<void> {
    await db.insert(categories).values({
      familyId: input.familyId,
      name: input.name,
      classification: input.classification,
      color: input.color,
      icon: input.icon,
      parentId: input.parentId,
      spendingNature: input.classification === "expense" ? (input.nature ?? null) : null,
    });
  }

  async update(input: UpdateCategoryInput & { parentId: number | null }): Promise<void> {
    await db
      .update(categories)
      .set({
        name: input.name,
        classification: input.classification,
        color: input.color,
        parentId: input.parentId,
        ...(input.classification === "income" ? { spendingNature: null } : input.nature !== undefined ? { spendingNature: input.nature } : {}),
      })
      .where(eq(categories.id, input.id));
  }

  async deleteWithBudgetLines(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
}
