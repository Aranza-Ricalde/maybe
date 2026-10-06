import type { CleanMerchantNameUseCase } from "./cleanMerchantName";
import type { LearnTransactionCategoryUseCase } from "./learnTransactionCategory";
import type { UpdateTransactionUseCase } from "./updateTransaction";
import type { ConceptMatchingRepository } from "@/domain/matching/ports";
import type { TransactionForMatching } from "@/domain/matching/ports";
import { bestConceptMatch, type TransactionMatchSignals } from "@/domain/matching/rules";
import { logFailure } from "@/lib/log";

export class ResolveTransactionConceptUseCase {
  constructor(
    private readonly cleanMerchantName: CleanMerchantNameUseCase,
    private readonly matchingRepo: ConceptMatchingRepository,
    private readonly categoryLearner?: LearnTransactionCategoryUseCase,
    private readonly updateTransaction?: UpdateTransactionUseCase,
  ) {}

  async execute(transactionId: number, familyId: number): Promise<void> {
    const tx = await this.matchingRepo.getTransactionForMatching(transactionId);
    if (!tx) return;

    const merchantPattern = await this.cleanMerchantName.execute(familyId, tx.rawDescription ?? tx.name);
    await this.matchingRepo.setTransactionMerchant(transactionId, merchantPattern.id);

    const categoryId = tx.categoryId ?? (await this.inheritCategory(transactionId, familyId, tx, merchantPattern.providerId));

    const candidates = await this.matchingRepo.listConceptCandidates(familyId);
    if (candidates.length === 0) return;

    const signals: TransactionMatchSignals = {
      accountId: tx.accountId,
      date: tx.date,
      amountCents: tx.amountCents,
      categoryId,
      providerId: merchantPattern.providerId,
    };

    const match = bestConceptMatch(signals, candidates);
    if (!match) return;

    const candidate = candidates.find((c) => c.conceptId === match.conceptId);
    const categoryAlreadyMatches = candidate != null && categoryId === candidate.categoryId;

    if (match.confidence === "strong" && categoryAlreadyMatches) {
      await this.matchingRepo.assignConcept(transactionId, match.conceptId);
    } else if (match.confidence !== "weak") {
      await this.matchingRepo.createSuggestion(familyId, transactionId, match.conceptId, match.score);
    }
  }

  private async inheritCategory(
    transactionId: number,
    familyId: number,
    tx: TransactionForMatching,
    providerId: number | null,
  ): Promise<number | null> {
    if (!this.categoryLearner || !this.updateTransaction || tx.kind !== "standard") return null;
    try {
      const learned = await this.categoryLearner.execute({ familyId, providerId, amountCents: tx.amountCents });
      if (!learned) return null;
      await this.updateTransaction.execute({
        id: transactionId,
        accountId: tx.accountId,
        date: tx.date,
        amountCents: tx.amountCents,
        name: tx.name,
        categoryId: learned.categoryId,
      });
      return learned.categoryId;
    } catch (err) {
      logFailure("categoría aprendida falló", err);
      return null;
    }
  }
}
