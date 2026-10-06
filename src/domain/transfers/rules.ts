import type { SuggestedTransferKind } from "./detection";

export const REVIEW_TOPICS = ["transfer_suspicion", "capture_confirmation"] as const;
export type ReviewTopic = (typeof REVIEW_TOPICS)[number];

export const REVIEW_DECISIONS = ["not_a_transfer", "confirmed_transfer", "pending_confirmation", "confirmed"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const CONFIRMABLE_TRANSFER_KINDS: readonly SuggestedTransferKind[] = ["transfer", "cc_payment", "loan_payment"];

export class InvalidTransferReviewError extends Error {}

export function assertValidReviewTopic(topic: string): asserts topic is ReviewTopic {
  if (!REVIEW_TOPICS.includes(topic as ReviewTopic)) throw new InvalidTransferReviewError(`Tema de revisión inválido: "${topic}".`);
}

export function assertValidReviewDecision(decision: string): asserts decision is ReviewDecision {
  if (!REVIEW_DECISIONS.includes(decision as ReviewDecision)) throw new InvalidTransferReviewError(`Decisión de revisión inválida: "${decision}".`);
}

export function assertConfirmableTransferKind(kind: string): asserts kind is SuggestedTransferKind {
  if (!CONFIRMABLE_TRANSFER_KINDS.includes(kind as SuggestedTransferKind)) throw new InvalidTransferReviewError(`Tipo de transferencia inválido: "${kind}".`);
}

export const TRANSFER_KIND_SHORT_LABELS: Record<SuggestedTransferKind, string> = {
  transfer: "Transferencia",
  cc_payment: "Pago de tarjeta",
  loan_payment: "Pago de deuda",
};

export const TRANSFER_KIND_LABELS: Record<SuggestedTransferKind, string> = {
  transfer: "Transferencia entre tus cuentas",
  cc_payment: "Pago de tarjeta de crédito",
  loan_payment: "Pago de préstamo o deuda",
};
