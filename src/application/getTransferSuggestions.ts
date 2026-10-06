import { detectTransferSuggestions, type TransferPairSuggestion, type TransferSingleSuggestion } from "@/domain/transfers/detection";
import { addDays } from "@/domain/payPeriod/rules";
import type { TransferReviewRepository } from "@/domain/transfers/ports";

export const SUGGESTION_WINDOW_DAYS = 365;

export interface SuggestionTransactionView {
  id: number;
  date: string;
  name: string;
  amountCents: number;
  accountName: string;
  categoryName: string | null;
}

export interface TransferPairView extends TransferPairSuggestion {
  outflow: SuggestionTransactionView;
  inflow: SuggestionTransactionView;
}

export interface TransferSingleView extends TransferSingleSuggestion {
  transaction: SuggestionTransactionView;
}

export interface TransferSuggestionsView {
  pairs: TransferPairView[];
  singles: TransferSingleView[];
  undecidedCount: number;
  impact: { expenseCents: number; incomeCents: number };
}

export class GetTransferSuggestionsUseCase {
  constructor(private readonly repo: TransferReviewRepository) {}

  async execute(familyId: number, today: string): Promise<TransferSuggestionsView> {
    const [accounts, transactions, rejected, decided] = await Promise.all([
      this.repo.listAccounts(familyId),
      this.repo.listStandardTransactions(familyId, addDays(today, -SUGGESTION_WINDOW_DAYS)),
      this.repo.listRejectedPairs(familyId),
      this.repo.listDecidedTransactionIds(familyId, "transfer_suspicion", "not_a_transfer"),
    ]);

    const result = detectTransferSuggestions({
      accounts,
      transactions,
      rejectedPairs: new Set(rejected.map((r) => `${r.outflowId}:${r.inflowId}`)),
      dismissedTransactionIds: new Set(decided),
    });

    const accountName = new Map(accounts.map((a) => [a.id, a.name]));
    const byId = new Map(transactions.map((t) => [t.id, t]));
    const view = (id: number): SuggestionTransactionView => {
      const t = byId.get(id) as NonNullable<ReturnType<typeof byId.get>>;
      return { id: t.id, date: t.date, name: t.name, amountCents: t.amountCents, accountName: accountName.get(t.accountId) ?? "—", categoryName: t.categoryName };
    };

    const pairs = result.pairs.map((p) => ({ ...p, outflow: view(p.outflowId), inflow: view(p.inflowId) }));
    const singles = result.singles.map((s) => ({ ...s, transaction: view(s.transactionId) }));

    const all = [...pairs.flatMap((p) => [p.outflow, p.inflow]), ...singles.map((s) => s.transaction)];
    return {
      pairs,
      singles,
      undecidedCount: result.undecidedCount,
      impact: {
        expenseCents: all.filter((t) => t.amountCents < 0).reduce((sum, t) => sum - t.amountCents, 0),
        incomeCents: all.filter((t) => t.amountCents > 0).reduce((sum, t) => sum + t.amountCents, 0),
      },
    };
  }
}
