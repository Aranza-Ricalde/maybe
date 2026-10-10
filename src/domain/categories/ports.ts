import type { Flow } from "@/domain/ledger/rules";
import type { SpendingNature } from "./nature";
import type { CategoryParentCandidate } from "./rules";

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
  parentId?: number | null;
  nature?: SpendingNature | null;
  description?: string | null;
}

export interface UpdateCategoryInput {
  id: number;
  name: string;
  classification: Flow;
  color: string;
  parentId?: number | null;
  nature?: SpendingNature | null;
  description?: string | null;
}

export interface CategoryHierarchyState extends CategoryParentCandidate {
  childClassifications: Flow[];
}

export interface CategoriesRepository {
  getById(id: number): Promise<CategoryRecord | null>;
  getHierarchyState(id: number): Promise<CategoryHierarchyState | null>;
  create(input: NewCategoryInput & { parentId: number | null }): Promise<void>;
  update(input: UpdateCategoryInput & { parentId: number | null }): Promise<void>;
  deleteWithBudgetLines(id: number): Promise<void>;
}

export interface CategoryUsageRepository {
  listUsageByProvider(familyId: number, providerId: number, flow: Flow): Promise<{ categoryId: number; count: number }[]>;
}

export interface UncategorizedTransaction {
  id: number;
  accountId: number;
  date: string;
  amountCents: number;
  name: string;
  rawDescription: string | null;
  merchantId: number | null;
  providerId: number | null;
  providerName: string | null;
  accountName: string;
}

export interface KnownProviderCategory {
  providerName: string;
  categoryId: number;
  categoryName: string;
  count: number;
}

export interface UncategorizedTransactionsRepository {
  listStandardUncategorized(familyId: number): Promise<UncategorizedTransaction[]>;
  listOwnerNames(familyId: number): Promise<string[]>;
  listKnownProviderCategories(familyId: number, flow: "income" | "expense"): Promise<KnownProviderCategory[]>;
}
