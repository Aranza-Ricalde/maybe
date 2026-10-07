import type { CategoryClassifier } from "@/domain/captures/ports";
import type { LedgerUnitOfWork } from "@/domain/ledger/ports";
import type { TransactionConceptResolver } from "@/domain/matching/ports";
import type { CategoriesReader } from "@/domain/readModels/ports";
import { logInfo } from "@/lib/log";
import { guessCategory } from "./guessCategory";
import { resolveConceptQuietly } from "./resolveConceptQuietly";
import type { UpdateTransactionUseCase } from "./updateTransaction";

const CONCURRENCY = 3;

export class EnrichImportedTransactionsUseCase {
  constructor(
    private readonly uow: LedgerUnitOfWork,
    private readonly categories: CategoriesReader,
    private readonly update: UpdateTransactionUseCase,
    private readonly resolver?: TransactionConceptResolver,
    private readonly classifier?: CategoryClassifier,
  ) {}

  async execute(familyId: number, transactionIds: number[]): Promise<{ categorizedByAi: number }> {
    let categorizedByAi = 0;
    const queue = [...transactionIds];
    const worker = async () => {
      for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
        if (await this.enrichOne(familyId, id)) categorizedByAi++;
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    logInfo("movimientos importados enriquecidos", { movimientos: transactionIds.length, categorizadosConIa: categorizedByAi });
    return { categorizedByAi };
  }

  private async enrichOne(familyId: number, transactionId: number): Promise<boolean> {
    await resolveConceptQuietly(this.resolver, transactionId, familyId, "estado de cuenta");
    const tx = await this.uow.run((ops) => ops.getTransaction(transactionId));
    if (!tx || tx.kind !== "standard" || tx.categoryId != null) return false;
    const guess = await guessCategory(this.classifier, this.categories, familyId, tx.name, tx.amountCents);
    if (!guess || guess.confidence !== "high") return false;
    await this.update.execute({ id: tx.id, accountId: tx.accountId, date: tx.date, amountCents: tx.amountCents, name: tx.name, categoryId: guess.categoryId, conceptId: tx.conceptId });
    return true;
  }
}
