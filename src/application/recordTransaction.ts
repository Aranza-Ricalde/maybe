import type { LedgerUnitOfWork } from "@/domain/ledger/ports";
import type { NewTransactionInput, TransactionRecord } from "@/domain/ledger/ports";
import { DUPLICATE_MATCH_WINDOW_DAYS, assertValidAmountCents, assertValidIsoDate, assertValidTransactionKind, assertValidTransactionName, assertValidTransactionSource, assertValidTransactionStatus, classifyFlow } from "@/domain/ledger/rules";
import { applyTransactionDelta } from "./applyTransactionDelta";
import { requireActiveAccount } from "./requireActiveAccount";

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
    assertValidTransactionName(input.name);
    assertValidTransactionKind(input.kind ?? "standard");
    assertValidTransactionStatus(input.status ?? "posted");
    assertValidTransactionSource(input.source);

    return this.uow.run(async (ops) => {
      const account = await requireActiveAccount(ops, input.accountId);

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
