import type { CaptureRepository, CategoryClassifier } from "@/domain/captures/ports";
import { CaptureAccountAmbiguousError, type CaptureSource, CaptureAccountNotFoundError, guessNeedsConfirmation, isApplicableGuess, normalizeAccountName, signedAmountCents, type CaptureType } from "@/domain/captures/rules";
import { classifyFlow } from "@/domain/ledger/rules";
import type { TransactionConceptResolver } from "@/domain/matching/ports";
import type { CategoriesReader } from "@/domain/readModels/ports";
import { logFailure } from "@/lib/log";
import { todayIso } from "@/lib/today";
import type { RecordTransactionUseCase } from "./recordTransaction";
import { resolveConceptQuietly } from "./resolveConceptQuietly";
import type { UpdateTransactionUseCase } from "./updateTransaction";

export interface CaptureMovementInput {
  familyId: number;
  account: { name: string } | { id: number };
  type: CaptureType;
  amountCents: number;
  description: string;
  date?: string;
  notes?: string;
  source?: CaptureSource;
}

export interface CaptureMovementResult {
  transactionId: number;
  accountName: string;
  date: string;
  amountCents: number;
  description: string;
  categoryId: number | null;
  categoryName: string | null;
  merchantName: string | null;
  needsConfirmation: boolean;
}

export class CaptureMovementUseCase {
  constructor(
    private readonly recordTransaction: RecordTransactionUseCase,
    private readonly updateTransaction: UpdateTransactionUseCase,
    private readonly captures: CaptureRepository,
    private readonly categories: CategoriesReader,
    private readonly conceptResolver?: TransactionConceptResolver,
    private readonly classifier?: CategoryClassifier,
  ) {}

  async execute(input: CaptureMovementInput): Promise<CaptureMovementResult> {
    const account = await this.resolveAccount(input.familyId, input.account);
    const date = input.date ?? todayIso();
    const amountCents = signedAmountCents(input.type, input.amountCents);

    const recorded = await this.recordTransaction.execute({ accountId: account.id, date, amountCents, name: input.description, notes: input.notes ?? null, source: input.source ?? "api" });
    await resolveConceptQuietly(this.conceptResolver, recorded.id, input.familyId, input.source ?? "api");

    let outcome = await this.captures.outcomeOf(recorded.id);
    let needsConfirmation = outcome?.categoryId == null;

    if (outcome?.categoryId == null) {
      const guessed = await this.guessCategory(input.familyId, input.description, amountCents);
      if (guessed) {
        await this.updateTransaction.execute({ id: recorded.id, accountId: account.id, date, amountCents, name: input.description, categoryId: guessed.categoryId });
        outcome = await this.captures.outcomeOf(recorded.id);
        needsConfirmation = guessNeedsConfirmation(guessed.confidence);
      }
    }

    if (needsConfirmation) await this.captures.markPending(input.familyId, recorded.id);

    return {
      transactionId: recorded.id,
      accountName: account.name,
      date,
      amountCents,
      description: input.description,
      categoryId: outcome?.categoryId ?? null,
      categoryName: outcome?.categoryName ?? null,
      merchantName: outcome?.merchantName ?? null,
      needsConfirmation,
    };
  }

  private async resolveAccount(familyId: number, reference: CaptureMovementInput["account"]) {
    const accounts = await this.captures.listActiveAccounts(familyId);
    if ("id" in reference) {
      const byId = accounts.find((account) => account.id === reference.id);
      if (!byId) throw new CaptureAccountNotFoundError("La cuenta ya no está activa.");
      return byId;
    }
    const wanted = normalizeAccountName(reference.name);
    const matches = accounts.filter((account) => normalizeAccountName(account.name) === wanted);
    if (matches.length === 0) throw new CaptureAccountNotFoundError(`No existe una cuenta activa llamada "${reference.name}".`);
    if (matches.length > 1) throw new CaptureAccountAmbiguousError(`Hay más de una cuenta llamada "${reference.name}".`);
    return matches[0];
  }

  private async guessCategory(familyId: number, description: string, amountCents: number) {
    if (!this.classifier) return null;
    try {
      const flow = classifyFlow(amountCents);
      const categories = (await this.categories.list(familyId)).filter((category) => category.classification === flow).map(({ id, name }) => ({ id, name }));
      if (categories.length === 0) return null;
      const guess = await this.classifier.classify({ description, amountCents, categories });
      return guess && isApplicableGuess(guess.confidence) && categories.some((category) => category.id === guess.categoryId) ? guess : null;
    } catch (error) {
      logFailure("clasificación con IA falló", error);
      return null;
    }
  }
}
