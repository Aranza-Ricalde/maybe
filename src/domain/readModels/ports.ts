import type { TransactionFilters, TransactionSort } from "@/domain/ledger/filters";
import type { BudgetPolicy } from "@/domain/recurring/budgetInclusion";
import type {
  BudgetSetting,
  CategoryTotal,
  ConceptSuggestionRow,
  FamilyAccount,
  FamilyCategory,
  FamilyGoal,
  FamilyMovementRow,
  FamilyRecurringItem,
  GoalAccountLink,
  MovementRow,
  Page,
  PeriodTransaction,
  RecentMovementRow,
  RecurringCandidateRow,
  ScheduledEntry,
  UserProfile,
} from "./types";

export interface AccountsReader {
  listActive(familyId: number): Promise<FamilyAccount[]>;
  listArchived(familyId: number): Promise<Array<FamilyAccount>>;
  balancesAsOf(accountIds: number[], asOfDate: string): Promise<Map<number, number>>;
  movementsPage(accountId: number, fromDateInclusive: string, toDateInclusive: string, page: number, pageSize: number): Promise<Page<MovementRow>>;
}

export interface CategoriesReader {
  list(familyId: number): Promise<FamilyCategory[]>;
  expenseTotalsBetween(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<CategoryTotal[]>;
}


export interface TransactionsReader {
  recent(familyId: number, limit: number): Promise<RecentMovementRow[]>;
  page(familyId: number, filters: TransactionFilters, sort: TransactionSort, page: number, pageSize: number): Promise<Page<FamilyMovementRow>>;
  between(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<PeriodTransaction[]>;
}

export interface PlanningReader {
  goals(familyId: number): Promise<FamilyGoal[]>;
  goalAccountLinks(familyId: number): Promise<GoalAccountLink[]>;
  scheduled(familyId: number): Promise<ScheduledEntry[]>;
  recurringItems(familyId: number): Promise<FamilyRecurringItem[]>;
  budgetSettings(familyId: number): Promise<BudgetSetting[]>;
  budgetPolicy(familyId: number): Promise<BudgetPolicy>;
}

export interface InboxReader {
  pendingRecurringCandidates(familyId: number): Promise<RecurringCandidateRow[]>;
  pendingConceptSuggestions(familyId: number): Promise<ConceptSuggestionRow[]>;
}

export interface ProfileReader {
  profile(userId: number): Promise<UserProfile | null>;
}
