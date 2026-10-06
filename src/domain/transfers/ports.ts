import type { DetectionAccount, DetectionTransaction } from "./detection";
import type { ReviewDecision, ReviewTopic } from "./rules";

export interface TransferReviewRepository {
  listAccounts(familyId: number): Promise<DetectionAccount[]>;
  listStandardTransactions(familyId: number, sinceDate?: string): Promise<DetectionTransaction[]>;
  listRejectedPairs(familyId: number): Promise<Array<{ outflowId: number; inflowId: number }>>;
  listDecidedTransactionIds(familyId: number, topic: ReviewTopic, decision: ReviewDecision): Promise<number[]>;
  rejectPair(outflowId: number, inflowId: number): Promise<void>;
  recordDecision(familyId: number, transactionId: number, topic: ReviewTopic, decision: ReviewDecision): Promise<void>;
  allBelongToFamily(familyId: number, transactionIds: number[]): Promise<boolean>;
  isConfirmedByReview(transactionId: number): Promise<boolean>;
  clearDecisions(transactionIds: number[], topic: ReviewTopic): Promise<void>;
  isLinkedTransfer(transactionId: number): Promise<boolean>;
}
