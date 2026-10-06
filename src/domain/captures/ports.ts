import type { CategoryGuessConfidence } from "./rules";

export interface ApiTokenInfo {
  lastFour: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface GeneratedApiToken {
  token: string;
  tokenHash: string;
  lastFour: string;
}

export interface ApiTokenCodec {
  generate(): GeneratedApiToken;
  hash(token: string): string;
}

export interface ApiTokenRepository {
  replaceToken(familyId: number, tokenHash: string, lastFour: string): Promise<void>;
  findFamilyByHash(tokenHash: string): Promise<number | null>;
  markUsed(tokenHash: string): Promise<void>;
  describe(familyId: number): Promise<ApiTokenInfo | null>;
}

export interface CaptureAccount {
  id: number;
  name: string;
}

export interface CaptureOutcome {
  categoryId: number | null;
  categoryName: string | null;
  merchantName: string | null;
}

export interface PendingCapture {
  transactionId: number;
  date: string;
  name: string;
  amountCents: number;
  accountName: string;
  categoryId: number | null;
  categoryName: string | null;
  source: string;
}

export interface CapturedTransactionView {
  transactionId: number;
  name: string;
  amountCents: number;
  accountName: string;
  categoryId: number | null;
  categoryName: string | null;
  merchantName: string | null;
  needsConfirmation: boolean;
}

export interface CaptureRepository {
  findCaptured(familyId: number, transactionId: number): Promise<CapturedTransactionView | null>;
  topCategories(familyId: number, flow: "expense" | "income", limit: number): Promise<Array<{ id: number; name: string }>>;
  listActiveAccounts(familyId: number): Promise<CaptureAccount[]>;
  outcomeOf(transactionId: number): Promise<CaptureOutcome | null>;
  markPending(familyId: number, transactionId: number): Promise<void>;
  isPending(familyId: number, transactionId: number): Promise<boolean>;
  markConfirmed(familyId: number, transactionId: number): Promise<void>;
  listPending(familyId: number): Promise<PendingCapture[]>;
}

export interface NotificationExtractor {
  extract(text: string): Promise<{ type: "expense" | "income"; amount: number; description: string; date?: string } | null>;
}

export interface CategoryGuess {
  categoryId: number;
  confidence: CategoryGuessConfidence;
}

export interface CategoryClassifierInput {
  description: string;
  amountCents: number;
  categories: Array<{ id: number; name: string }>;
}

export interface CategoryClassifier {
  classify(input: CategoryClassifierInput): Promise<CategoryGuess | null>;
}
