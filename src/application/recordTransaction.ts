import type { LedgerUnitOfWork } from "@/domain/ledger/ports";
import type { NewTransactionInput, TransactionRecord } from "@/domain/ledger/ports";
import { DUPLICATE_MATCH_WINDOW_DAYS, InvalidTransactionError, assertValidAmountCents, assertValidIsoDate, classifyFlow } from "@/domain/ledger/rules";
import { applyTransactionDelta } from "./applyTransactionDelta";

export class DuplicateTransactionError extends Error {
  constructor(public readonly candidates: TransactionRecord[]) {
    super(`${candidates.length} posible(s) duplicado(s) encontrado(s) — confirma antes de insertar`);
  }
}

export interface RecordTransactionOptions {
  skipDuplicateCheck?: boolean;
}

export class RecordTransactionUseCase {
  constructor(private readonly uow: LedgerUnitOfWork) {}

  async execute(input: NewTransactionInput, options: RecordTransactionOptions = {}): Promise<TransactionRecord> {
    assertValidAmountCents(input.amountCents);
    assertValidIsoDate(input.date);
    if (!input.name.trim()) {
      throw new InvalidTransactionError("name no puede estar vacío");
    }

    return this.uow.run(async (ops) => {
      const account = await ops.getAccount(input.accountId);
      if (!account) {
        throw new InvalidTransactionError(`la cuenta ${input.accountId} no existe`);
      }
      if (!account.isActive) {
        throw new InvalidTransactionError(`la cuenta ${input.accountId} está inactiva`);
      }

      if (input.source === "csv_import" && !options.skipDuplicateCheck) {
        const candidates = await ops.findPossibleDuplicates(
          input.accountId,
          input.amountCents,
          input.date,
          DUPLICATE_MATCH_WINDOW_DAYS,
        );
        const manualOrTelegram = candidates.filter((c) => c.source === "manual" || c.source === "telegram");
        if (manualOrTelegram.length > 0) {
          throw new DuplicateTransactionError(manualOrTelegram);
        }
      }

      const kind = input.kind ?? "standard";
      const transaction = await ops.insertTransaction({ ...input, kind, status: input.status ?? "posted" });

      await applyTransactionDelta(ops, {
        familyId: account.familyId,
        accountId: input.accountId,
        date: input.date,
        amountCents: input.amountCents,
        categoryId: input.categoryId ?? null,
        kind,
        flow: classifyFlow(input.amountCents),
      });

      return transaction;
    });
  }
}
