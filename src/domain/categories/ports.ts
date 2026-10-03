import type { Flow } from "@/domain/ledger/rules";

export interface CategoryRecord {
  id: number;
  familyId: number;
}

export interface NewCategoryInput {
  familyId: number;
  name: string;
  classification: Flow;
  color: string;
  icon: string;
}

export interface UpdateCategoryInput {
  id: number;
  name: string;
  classification: Flow;
  color: string;
}

export interface CategoriesRepository {
  getById(id: number): Promise<CategoryRecord | null>;
  create(input: NewCategoryInput): Promise<void>;
  update(input: UpdateCategoryInput): Promise<void>;
  deleteWithBudgetLines(id: number): Promise<void>;
}
