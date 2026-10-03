import { eq } from "drizzle-orm";
import type { CategoriesRepository, CategoryRecord, NewCategoryInput, UpdateCategoryInput } from "@/domain/categories/ports";
import { db } from "./client";
import { categories } from "./schema/classification";

export class DrizzleCategoriesRepository implements CategoriesRepository {
  async getById(id: number): Promise<CategoryRecord | null> {
    const [row] = await db.select({ id: categories.id, familyId: categories.familyId }).from(categories).where(eq(categories.id, id));
    return row ?? null;
  }

  async create(input: NewCategoryInput): Promise<void> {
    await db.insert(categories).values({
      familyId: input.familyId,
      name: input.name,
      classification: input.classification,
      color: input.color,
      icon: input.icon,
    });
  }

  async update(input: UpdateCategoryInput): Promise<void> {
    await db
      .update(categories)
      .set({ name: input.name, classification: input.classification, color: input.color })
      .where(eq(categories.id, input.id));
  }

  async deleteWithBudgetLines(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
}
