import {
  InvalidOccurrenceLinkError,
  PAYMENT_CANDIDATE_WINDOW_DAYS,
  assertOccurrenceCanBeLinked,
  rankPaymentCandidates,
  type RankedPaymentCandidate,
} from "@/domain/recurring/paymentCandidates";
import type { LinkableTransaction, OccurrenceForLink, RecurringOccurrencesRepository } from "@/domain/recurring/ports";

function windowAround(date: string): { from: string; to: string } {
  const shift = (days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
  return { from: shift(-PAYMENT_CANDIDATE_WINDOW_DAYS), to: shift(PAYMENT_CANDIDATE_WINDOW_DAYS) };
}

async function loadOwnedOccurrence(repo: RecurringOccurrencesRepository, familyId: number, occurrenceId: number): Promise<OccurrenceForLink> {
  const occurrence = await repo.getOccurrenceForLink(occurrenceId);
  if (!occurrence || occurrence.familyId !== familyId) throw new InvalidOccurrenceLinkError("La ocurrencia no existe.");
  return occurrence;
}

export class ListOccurrencePaymentCandidatesUseCase {
  constructor(private readonly repo: RecurringOccurrencesRepository) {}

  async execute(familyId: number, occurrenceId: number): Promise<RankedPaymentCandidate<LinkableTransaction>[]> {
    const occurrence = await loadOwnedOccurrence(this.repo, familyId, occurrenceId);
    const { from, to } = windowAround(occurrence.expectedDate);
    return rankPaymentCandidates(occurrence, await this.repo.listLinkableTransactions(familyId, from, to));
  }
}

export class LinkOccurrenceTransactionUseCase {
  constructor(private readonly repo: RecurringOccurrencesRepository) {}

  async execute(familyId: number, occurrenceId: number, transactionId: number): Promise<void> {
    const occurrence = await loadOwnedOccurrence(this.repo, familyId, occurrenceId);
    assertOccurrenceCanBeLinked(occurrence);
    const { from, to } = windowAround(occurrence.expectedDate);
    const candidates = rankPaymentCandidates(occurrence, await this.repo.listLinkableTransactions(familyId, from, to), Number.MAX_SAFE_INTEGER);
    if (!candidates.some((c) => c.id === transactionId)) {
      throw new InvalidOccurrenceLinkError("Ese movimiento no puede pagar esta ocurrencia.");
    }
    await this.repo.linkTransaction(occurrenceId, transactionId);
  }
}
