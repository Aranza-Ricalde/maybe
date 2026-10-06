import { type TransferDetectionInput, type TransferDetectionResult, type TransferSingleSuggestion } from "./detectionModel";
import { detectPairs } from "./pairDetection";
import { singleSuggestion } from "./singleDetection";

export * from "./detectionModel";

export function detectTransferSuggestions(input: TransferDetectionInput): TransferDetectionResult {
  const accounts = new Map(input.accounts.map((a) => [a.id, a]));
  const usable = input.transactions.filter((t) => t.kind === "standard" && !input.dismissedTransactionIds.has(t.id));

  const pairs = detectPairs(input, usable, accounts).sort((a, b) => b.score - a.score);
  const paired = new Set(pairs.flatMap((p) => [p.outflowId, p.inflowId]));

  const singles: TransferSingleSuggestion[] = [];
  let undecidedCount = 0;
  for (const tx of usable) {
    if (paired.has(tx.id)) continue;
    const result = singleSuggestion(tx, accounts.get(tx.accountId));
    if (result === "undecided") undecidedCount++;
    else if (result) singles.push(result);
  }
  singles.sort((a, b) => b.score - a.score || a.transactionId - b.transactionId);

  return { pairs, singles, undecidedCount };
}

