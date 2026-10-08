import assert from "node:assert/strict";
import { test } from "node:test";
import type { TransferPairView, TransferSingleView } from "@/application/getTransferSuggestions";
import { buildTransferReviewItems } from "./transferReview";

const pair = (outflowId: number, confidence: "strong" | "weak") => ({ outflowId, inflowId: outflowId + 100, confidence }) as unknown as TransferPairView;
const single = (transactionId: number) => ({ transactionId }) as unknown as TransferSingleView;

test("las parejas seguras van primero, luego las dudosas y al final las sueltas", () => {
  const items = buildTransferReviewItems([pair(1, "weak"), pair(2, "strong")], [single(9)]);
  assert.deepEqual(items.map((item) => item.key), ["p-2-102", "p-1-101", "s-9"]);
});

test("sin sugerencias la cola queda vacía", () => {
  assert.deepEqual(buildTransferReviewItems([], []), []);
});
