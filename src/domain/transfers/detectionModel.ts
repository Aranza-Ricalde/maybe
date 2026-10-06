import type { AccountType } from "@/domain/accounts/rules";
import type { TransactionKind } from "@/domain/ledger/rules";

export type SuggestedTransferKind = Extract<TransactionKind, "transfer" | "cc_payment" | "loan_payment">;
export type SuggestionConfidence = "strong" | "medium";

export interface DetectionAccount {
  id: number;
  name: string;
  type: AccountType;
}

export interface DetectionTransaction {
  id: number;
  accountId: number;
  date: string;
  amountCents: number;
  name: string;
  kind: TransactionKind;
  categoryName: string | null;
}

export interface TransferPairSuggestion {
  type: "pair";
  outflowId: number;
  inflowId: number;
  kind: SuggestedTransferKind;
  confidence: SuggestionConfidence;
  score: number;
  reasons: string[];
  alternativeIds: number[];
}

export interface TransferSingleSuggestion {
  type: "single";
  transactionId: number;
  kind: SuggestedTransferKind;
  confidence: SuggestionConfidence;
  score: number;
  reasons: string[];
}

export interface TransferDetectionResult {
  pairs: TransferPairSuggestion[];
  singles: TransferSingleSuggestion[];
  undecidedCount: number;
}

export interface TransferDetectionInput {
  transactions: DetectionTransaction[];
  accounts: DetectionAccount[];
  rejectedPairs: Set<string>;
  dismissedTransactionIds: Set<number>;
}

export const pairKey = (outflowId: number, inflowId: number) => `${outflowId}:${inflowId}`;
