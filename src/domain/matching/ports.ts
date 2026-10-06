import type { TransactionKind } from "@/domain/ledger/rules";
import type { ConceptMatchCandidate } from "./rules";

export interface TransactionForMatching {
  accountId: number;
  date: string;
  amountCents: number;
  categoryId: number | null;
  kind: TransactionKind;
  rawDescription: string | null;
  name: string;
}

export interface ConceptMatchSuggestionRecord {
  id: number;
  familyId: number;
  transactionId: number;
  suggestedConceptId: number;
  score: number;
  status: "pending" | "confirmed" | "rejected";
}

export interface TransactionMerchant {
  merchantName: string;
  providerId: number | null;
}

export interface ConceptMatchingRepository {
  getTransactionMerchant(transactionId: number): Promise<TransactionMerchant | null>;
  getTransactionForMatching(transactionId: number): Promise<TransactionForMatching | null>;
  listConceptCandidates(familyId: number): Promise<ConceptMatchCandidate[]>;
  setTransactionMerchant(transactionId: number, merchantId: number): Promise<void>;
  assignConcept(transactionId: number, conceptId: number): Promise<void>;
  createSuggestion(familyId: number, transactionId: number, conceptId: number, score: number): Promise<void>;
  getSuggestionById(id: number): Promise<ConceptMatchSuggestionRecord | null>;
  markSuggestionRejected(id: number): Promise<void>;
  deleteSuggestion(id: number): Promise<void>;
}

export interface TransactionConceptResolver {
  execute(transactionId: number, familyId: number): Promise<void>;
}
