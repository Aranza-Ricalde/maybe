import type { TransferPairView, TransferSingleView } from "@/application/getTransferSuggestions";

export type TransferReviewItem = { key: string; pair: TransferPairView; single?: undefined } | { key: string; single: TransferSingleView; pair?: undefined };

const pairKey = (pair: TransferPairView) => `p-${pair.outflowId}-${pair.inflowId}`;

export function buildTransferReviewItems(pairs: TransferPairView[], singles: TransferSingleView[]): TransferReviewItem[] {
  return [
    ...pairs.filter((pair) => pair.confidence === "strong").map((pair) => ({ key: pairKey(pair), pair })),
    ...pairs.filter((pair) => pair.confidence !== "strong").map((pair) => ({ key: pairKey(pair), pair })),
    ...singles.map((single) => ({ key: `s-${single.transactionId}`, single })),
  ];
}
