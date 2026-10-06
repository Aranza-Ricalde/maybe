import type { CalendarScheduledInput } from "@/domain/calendar/rules";
import type { AccountType } from "@/domain/accounts/rules";
import type { SpendingNature } from "@/domain/categories/nature";
import type { Flow, TransactionKind } from "@/domain/ledger/rules";
import type { BudgetCadence } from "@/domain/budget/rules";
import type { BudgetInclusion } from "@/domain/recurring/budgetInclusion";
import type { RecurringStatus } from "@/domain/recurring/rules";

export interface FamilyAccount {
  id: number;
  name: string;
  type: AccountType;
  details: unknown;
}

export interface FamilyCategory {
  id: number;
  parentId: number | null;
  name: string;
  color: string;
  icon: string;
  classification: Flow;
  spendingNature: SpendingNature | null;
}

export interface FamilyGoal {
  id: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
}

export interface GoalAccountLink {
  goalId: number;
  accountId: number;
}

export interface FamilyRecurringItem {
  id: number;
  name: string;
  flow: Flow;
  estimatedAmountCents: number;
  categoryId: number | null;
  conceptId: number | null;
  accountId: number | null;
  providerId: number | null;
  dayOfMonth: number;
  status: RecurringStatus;
  budgetInclusion: BudgetInclusion | null;
}

export interface ScheduledEntry extends CalendarScheduledInput {
  id: number;
}

export interface BudgetSetting {
  categoryId: number;
  cadence: BudgetCadence;
  budgetedAmountCents: number;
}

export interface CategoryTotal {
  categoryId: number;
  totalCents: number;
}

export interface RecurringCandidateRow {
  id: number;
  suggestedName: string;
  suggestedAmountCents: number;
}

export interface ConceptSuggestionRow {
  id: number;
  score: number;
  transactionId: number;
  transactionName: string;
  transactionDate: string;
  transactionAmountCents: number;
  conceptId: number;
  conceptName: string;
}

export interface MovementRow {
  id: number;
  date: string;
  amountCents: number;
  name: string;
  kind: TransactionKind;
  categoryName: string | null;
}

export interface RecentMovementRow extends MovementRow {
  accountName: string;
}

export interface FamilyMovementRow extends RecentMovementRow {
  accountId: number;
  categoryId: number | null;
  reviewDecision: string | null;
}

export interface Page<T> {
  rows: T[];
  total: number;
}

export interface PeriodTransaction {
  id: number;
  name: string;
  date: string;
  amountCents: number;
  accountId: number;
  categoryId: number | null;
  conceptId: number | null;
  providerId: number | null;
}

export interface UserProfile {
  email: string;
  telegramChatId: string | null;
}
