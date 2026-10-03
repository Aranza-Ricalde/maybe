import type { CleanMerchantNameUseCase } from "./cleanMerchantName";
import type { ConceptMatchingRepository } from "@/domain/matching/ports";
import { bestConceptMatch, type TransactionMatchSignals } from "@/domain/matching/rules";

export class ResolveTransactionConceptUseCase {
  constructor(
    private readonly cleanMerchantName: CleanMerchantNameUseCase,
    private readonly matchingRepo: ConceptMatchingRepository,
  ) {}

  async execute(transactionId: number, familyId: number): Promise<void> {
    const tx = await this.matchingRepo.getTransactionForMatching(transactionId);
    if (!tx) return;

    const hasRawDescription = Boolean(tx.rawDescription?.trim());
    const merchantPattern = await this.cleanMerchantName.execute(familyId, tx.rawDescription ?? tx.name, !hasRawDescription);
    await this.matchingRepo.setTransactionMerchant(transactionId, merchantPattern.id);

    const candidates = await this.matchingRepo.listConceptCandidates(familyId);
    if (candidates.length === 0) return;

    const signals: TransactionMatchSignals = {
      accountId: tx.accountId,
      date: tx.date,
      amountCents: tx.amountCents,
      categoryId: tx.categoryId,
      providerId: merchantPattern.providerId,
    };

    const match = bestConceptMatch(signals, candidates);
    if (!match) return;

    const candidate = candidates.find((c) => c.conceptId === match.conceptId);
    const categoryAlreadyMatches = candidate != null && tx.categoryId === candidate.categoryId;

    if (match.confidence === "strong" && categoryAlreadyMatches) {
      await this.matchingRepo.assignConcept(transactionId, match.conceptId);
    } else if (match.confidence !== "weak") {
      // "weak" (solo coincide categoría, sin proveedor ni monto/día) es señal insuficiente —
      // nunca se sugiere, ver principios.md "Regla de Oro": nunca asociar con señal débil.
      await this.matchingRepo.createSuggestion(familyId, transactionId, match.conceptId, match.score);
    }
  }
}
