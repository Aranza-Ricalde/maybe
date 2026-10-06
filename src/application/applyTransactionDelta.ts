import type { LedgerOperations, TransactionRecord } from "@/domain/ledger/ports";
import { affectsAggregateTotals, classifyFlow, monthStart, type Flow, type TransactionKind } from "@/domain/ledger/rules";

export interface TransactionDelta {
  familyId: number;
  accountId: number;
  date: string;
  amountCents: number;
  categoryId: number | null;
  kind: TransactionKind;
  flow: Flow;
}

export async function applyTransactionDelta(ops: LedgerOperations, delta: TransactionDelta): Promise<void> {
  await ops.applyAccountBalanceDelta(delta.accountId, delta.date, delta.amountCents);
  await applyAggregateDelta(ops, delta);
}

export async function applyAggregateDelta(ops: LedgerOperations, delta: TransactionDelta): Promise<void> {
  if (!affectsAggregateTotals(delta.kind)) return;

  const month = monthStart(delta.date);
  if (delta.categoryId != null) {
    await ops.applyCategoryMonthlyDelta(delta.familyId, delta.categoryId, month, delta.amountCents);
  }
  await ops.applyIncomeExpenseMonthlyDelta(
    delta.familyId,
    month,
    delta.flow === "income" ? delta.amountCents : 0,
    delta.flow === "expense" ? delta.amountCents : 0,
  );
}

export async function reverseTransaction(ops: LedgerOperations, existing: TransactionRecord): Promise<void> {
  const account = await ops.getAccount(existing.accountId);
  if (!account) return;

  await applyTransactionDelta(ops, {
    familyId: account.familyId,
    accountId: existing.accountId,
    date: existing.date,
    amountCents: -existing.amountCents,
    categoryId: existing.categoryId ?? null,
    kind: existing.kind,
    flow: classifyFlow(existing.amountCents),
  });
}
