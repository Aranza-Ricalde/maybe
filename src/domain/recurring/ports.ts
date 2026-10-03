import type { Flow } from "@/domain/ledger/rules";
import type { RecurringGroupResult, TransactionForDetection } from "./rules";

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

export type RecurringItemStatus = "active" | "paused";

export interface RecurringItemRecord {
  id: number;
  familyId: number;
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
