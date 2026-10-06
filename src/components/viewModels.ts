export interface RecentTransactionView {
  id: number;
  date: string;
  amountCents: number;
  name: string;
  kind: string;
  accountName: string;
  categoryName: string | null;
}

export interface TransactionRowView extends RecentTransactionView {
  accountId: number;
  categoryId: number | null;
  reviewDecision: string | null;
}

export interface RecurringCandidateView {
  id: number;
  suggestedName: string;
  suggestedAmountCents: number;
}

export interface ConceptSuggestionView {
  id: number;
  score: number;
  transactionId: number;
  transactionName: string;
  transactionDate: string;
  transactionAmountCents: number;
  conceptId: number;
  conceptName: string;
}

export interface TransactionsPageView {
  rows: TransactionRowView[];
  total: number;
}

export interface AccountOption {
  id: number;
  name: string;
}

export interface CategoryOption {
  id: number;
  name: string;
  label?: string;
}
