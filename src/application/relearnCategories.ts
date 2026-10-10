import type { UncategorizedTransactionsRepository } from "@/domain/categories/ports";
import type { CleanMerchantNameUseCase } from "./cleanMerchantName";
import type { LearnTransactionCategoryUseCase } from "./learnTransactionCategory";
import type { UpdateTransactionUseCase } from "./updateTransaction";

export interface RelearnedTransaction {
  transactionId: number;
  name: string;
  amountCents: number;
  providerId: number;
  categoryId: number;
  share: number;
  sample: number;
  merchantWasMissing: boolean;
}

export interface RelearnReport {
  pending: number;
  withoutProvider: number;
  withoutEvidence: number;
  excluded: number;
  learned: RelearnedTransaction[];
}

export interface TransactionMerchantSetter {
  setTransactionMerchant(transactionId: number, merchantId: number): Promise<void>;
}

export class RelearnCategoriesUseCase {
  constructor(
    private readonly pending: UncategorizedTransactionsRepository,
    private readonly merchants: CleanMerchantNameUseCase,
    private readonly merchantSetter: TransactionMerchantSetter,
    private readonly learner: LearnTransactionCategoryUseCase,
    private readonly update: UpdateTransactionUseCase,
  ) {}

  async execute(input: { familyId: number; apply: boolean; excludeProviderIds?: number[] }): Promise<RelearnReport> {
    const rows = await this.pending.listStandardUncategorized(input.familyId);
    const report: RelearnReport = { pending: rows.length, withoutProvider: 0, withoutEvidence: 0, excluded: 0, learned: [] };
    const excluded = new Set(input.excludeProviderIds ?? []);

    for (const tx of rows) {
      const merchantWasMissing = tx.merchantId == null;
      const raw = tx.rawDescription ?? tx.name;
      let providerId = tx.providerId;
      if (merchantWasMissing) {
        providerId = await this.merchants.peekProviderId(input.familyId, raw);
        if (providerId != null && excluded.has(providerId)) {
          report.excluded++;
          continue;
        }
        if (input.apply) providerId = await this.resolveAndLink(input.familyId, tx.id, raw);
      }
      if (providerId != null && excluded.has(providerId)) {
        report.excluded++;
        continue;
      }
      if (providerId == null) {
        report.withoutProvider++;
        continue;
      }
      const learned = await this.learner.execute({ familyId: input.familyId, providerId, amountCents: tx.amountCents });
      if (!learned) {
        report.withoutEvidence++;
        continue;
      }
      if (input.apply) {
        await this.update.execute({ id: tx.id, accountId: tx.accountId, date: tx.date, amountCents: tx.amountCents, name: tx.name, categoryId: learned.categoryId });
      }
      report.learned.push({ transactionId: tx.id, name: tx.name, amountCents: tx.amountCents, providerId, categoryId: learned.categoryId, share: learned.share, sample: learned.sample, merchantWasMissing });
    }
    return report;
  }

  private async resolveAndLink(familyId: number, transactionId: number, raw: string): Promise<number | null> {
    const pattern = await this.merchants.execute(familyId, raw);
    await this.merchantSetter.setTransactionMerchant(transactionId, pattern.id);
    return pattern.providerId;
  }
}
