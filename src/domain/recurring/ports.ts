import type { Flow } from "@/domain/ledger/rules";
import type { BudgetInclusion, BudgetPolicy } from "./budgetInclusion";
import type { CalendarOccurrenceInput } from "@/domain/calendar/rules";
import type { OccurrenceSyncPlan, RecurringItemForOccurrences, StoredOccurrence, TransactionForOccurrences } from "./occurrences";
import type { OccurrenceMatchSource, RecurringGroupResult, RecurringOccurrenceStatus, RecurringStatus, TransactionForDetection } from "./rules";

export interface RecurringCandidateRecord {
  id: number;
  familyId: number;
  patternSignature: string;
  suggestedName: string;
  suggestedAmountCents: number;
  suggestedCategoryId: number | null;
  accountId: number | null;
  status: "pending" | "accepted" | "dismissed";
}

export interface RecurringCandidateRepository {
  getRecentTransactions(familyId: number, monthsBack: number): Promise<TransactionForDetection[]>;
  findExistingPatternSignatures(familyId: number, patternSignatures: string[]): Promise<Set<string>>;
  createCandidates(familyId: number, groups: RecurringGroupResult[]): Promise<RecurringCandidateRecord[]>;
  getById(id: number): Promise<RecurringCandidateRecord | null>;
  markAccepted(id: number, acceptedRecurringItemId: number): Promise<void>;
  markDismissed(id: number): Promise<void>;
  clearAcceptedRecurringItemId(recurringItemId: number): Promise<void>;
}

export type RecurringItemStatus = RecurringStatus;

export interface RecurringItemRecord {
  id: number;
  familyId: number;
  conceptId: number | null;
}

export interface RecurringBudgetRepository {
  getPolicy(familyId: number): Promise<BudgetPolicy>;
  setPolicy(familyId: number, policy: BudgetPolicy): Promise<void>;
  getItem(id: number): Promise<{ id: number; familyId: number } | null>;
  setInclusion(id: number, inclusion: BudgetInclusion | null): Promise<void>;
  setInclusionForUndecided(familyId: number, inclusion: BudgetInclusion): Promise<number>;
}

export interface NewRecurringItemInput {
  familyId: number;
  name: string;
  flow: Flow;
  estimatedAmountCents: number;
  dayOfMonth: number;
  categoryId: number | null;
  conceptId: number | null;
  accountId: number | null;
  autoDetected: boolean;
  budgetInclusion?: BudgetInclusion | null;
}

export interface UpdateRecurringItemInput {
  id: number;
  name: string;
  flow: Flow;
  estimatedAmountCents: number;
  dayOfMonth: number;
  categoryId: number | null;
  conceptId: number | null;
  accountId: number | null;
}

export interface RecurringItemsRepository {
  getById(id: number): Promise<RecurringItemRecord | null>;
  create(input: NewRecurringItemInput): Promise<RecurringItemRecord>;
  update(input: UpdateRecurringItemInput): Promise<void>;
  delete(id: number): Promise<void>;
  setStatus(id: number, status: RecurringItemStatus): Promise<void>;
}

export interface OccurrenceForLink {
  id: number;
  familyId: number;
  flow: Flow;
  expectedDate: string;
  expectedAmountCents: number;
  status: RecurringOccurrenceStatus;
  transactionId: number | null;
}

export interface LinkableTransaction {
  id: number;
  name: string;
  date: string;
  amountCents: number;
  accountName: string;
}

export interface RecurringOccurrencesRepository {
  getRecurringItems(familyId: number): Promise<RecurringItemForOccurrences[]>;
  listOccurrences(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<StoredOccurrence[]>;
  listTransactions(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<TransactionForOccurrences[]>;
  listForCalendar(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<CalendarOccurrenceInput[]>;
  getOccurrence(id: number): Promise<{ id: number; familyId: number } | null>;
  applyDecision(id: number, outcome: { status: RecurringOccurrenceStatus; matchSource: OccurrenceMatchSource }): Promise<void>;
  getOccurrenceForLink(id: number): Promise<OccurrenceForLink | null>;
  listLinkableTransactions(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<LinkableTransaction[]>;
  linkTransaction(occurrenceId: number, transactionId: number): Promise<void>;
  applyPlan(familyId: number, plan: OccurrenceSyncPlan): Promise<void>;
}
