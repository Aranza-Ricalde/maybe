import type { Flow } from "@/domain/ledger/rules";
import type { TRANSFER_KIND_LABELS } from "@/domain/transfers/rules";

export type ReviewTransferKind = keyof typeof TRANSFER_KIND_LABELS;

export const TRANSFER_CHOICES: Record<Flow, ReviewTransferKind[]> = {
  expense: ["transfer", "cc_payment", "loan_payment"],
  income: ["transfer"],
};

export const kindChoice = (kind: string) => `kind:${kind}`;
export const categoryChoice = (id: number) => `category:${id}`;

export function flowOfAmount(amountCents: number): Flow {
  return amountCents < 0 ? "expense" : "income";
}
