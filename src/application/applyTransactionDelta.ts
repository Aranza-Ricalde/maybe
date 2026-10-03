import type { LedgerOperations } from "@/domain/ledger/ports";
import { affectsAggregateTotals, monthStart, type Flow, type TransactionKind } from "@/domain/ledger/rules";

export interface TransactionDelta {
  familyId: number;
  accountId: number;
  date: string;
  amountCents: number;
  categoryId: number | null;
  kind: TransactionKind;
  /**
   * Bucket (income/expense) al que pertenece este movimiento, SIEMPRE según el signo del monto
   * original de la transacción — nunca el del delta ya negado para una reversión. Reversar un
   * gasto de -10000 (delta +10000) debe seguir restando de expenseCents, no sumar a incomeCents.
   */
  flow: Flow;
}

export async function applyTransactionDelta(ops: LedgerOperations, delta: TransactionDelta): Promise<void> {
  await ops.applyAccountBalanceDelta(delta.accountId, delta.date, delta.amountCents);
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
