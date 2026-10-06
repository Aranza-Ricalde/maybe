import type { LedgerOperations, LedgerUnitOfWork, TransactionRecord } from "@/domain/ledger/ports";
import { TRANSFER_KINDS, classifyFlow, type TransactionKind } from "@/domain/ledger/rules";
import type { SuggestedTransferKind } from "@/domain/transfers/detection";
import type { TransferReviewRepository } from "@/domain/transfers/ports";
import { InvalidTransferReviewError, assertConfirmableTransferKind } from "@/domain/transfers/rules";
import { applyAggregateDelta } from "./applyTransactionDelta";

const isTransferKind = (kind: TransactionKind) => TRANSFER_KINDS.includes(kind);

export class ResolveTransferSuggestionUseCase {
  constructor(
    private readonly uow: LedgerUnitOfWork,
    private readonly reviews: TransferReviewRepository,
  ) {}

  async confirmPair(familyId: number, outflowId: number, inflowId: number, kind: string): Promise<void> {
    assertConfirmableTransferKind(kind);
    if (outflowId === inflowId) throw new InvalidTransferReviewError("Los dos movimientos deben ser distintos.");
    if (!(await this.reviews.allBelongToFamily(familyId, [outflowId, inflowId]))) throw new InvalidTransferReviewError("El movimiento no existe.");
    if ((await this.reviews.isLinkedTransfer(outflowId)) || (await this.reviews.isLinkedTransfer(inflowId))) {
      throw new InvalidTransferReviewError("Alguno de los movimientos ya es parte de una transferencia.");
    }

    await this.uow.run(async (ops) => {
      const outflow = await this.requireStandard(ops, outflowId);
      const inflow = await this.requireStandard(ops, inflowId);
      if (outflow.amountCents >= 0 || inflow.amountCents <= 0 || outflow.amountCents !== -inflow.amountCents) {
        throw new InvalidTransferReviewError("Los movimientos no son una salida y una entrada por el mismo monto.");
      }
      if (outflow.accountId === inflow.accountId) throw new InvalidTransferReviewError("Una transferencia une dos cuentas distintas.");

      const [outAccount, inAccount] = await Promise.all([ops.getAccount(outflow.accountId), ops.getAccount(inflow.accountId)]);
      if (!outAccount || !inAccount || outAccount.familyId !== familyId || inAccount.familyId !== familyId) {
        throw new InvalidTransferReviewError("El movimiento no existe.");
      }

      await this.reclassify(ops, outflow, outAccount.familyId, kind);
      await this.reclassify(ops, inflow, inAccount.familyId, kind);
      await ops.linkTransfer(outflow.id, inflow.id);
    });
    await this.reviews.recordDecision(familyId, outflowId, "transfer_suspicion", "confirmed_transfer");
    await this.reviews.recordDecision(familyId, inflowId, "transfer_suspicion", "confirmed_transfer");
  }

  async confirmSingle(familyId: number, transactionId: number, kind: string): Promise<void> {
    assertConfirmableTransferKind(kind);
    if (!(await this.reviews.allBelongToFamily(familyId, [transactionId]))) throw new InvalidTransferReviewError("El movimiento no existe.");

    await this.uow.run(async (ops) => {
      const tx = await this.requireStandard(ops, transactionId);
      const account = await ops.getAccount(tx.accountId);
      if (!account || account.familyId !== familyId) throw new InvalidTransferReviewError("El movimiento no existe.");
      await this.reclassify(ops, tx, account.familyId, kind);
    });
    await this.reviews.recordDecision(familyId, transactionId, "transfer_suspicion", "confirmed_transfer");
  }

  async undoConfirmed(familyId: number, transactionId: number): Promise<void> {
    if (!(await this.reviews.allBelongToFamily(familyId, [transactionId]))) throw new InvalidTransferReviewError("El movimiento no existe.");
    if (!(await this.reviews.isConfirmedByReview(transactionId))) {
      throw new InvalidTransferReviewError("Solo se pueden deshacer las transferencias que confirmaste desde la revisión.");
    }

    const restored = await this.uow.run(async (ops) => {
      const tx = await ops.getTransaction(transactionId);
      if (!tx || !isTransferKind(tx.kind)) throw new InvalidTransferReviewError("El movimiento ya no es una transferencia confirmada.");
      const partnerId = await ops.findTransferPartner(transactionId);
      const partner = partnerId != null ? await ops.getTransaction(partnerId) : null;

      const ids: number[] = [];
      for (const t of [tx, partner]) {
        if (!t || !isTransferKind(t.kind)) continue;
        const account = await ops.getAccount(t.accountId);
        if (!account || account.familyId !== familyId) throw new InvalidTransferReviewError("El movimiento no existe.");
        await this.restoreAsStandard(ops, t, account.familyId);
        ids.push(t.id);
      }
      await ops.unlinkTransfer(transactionId);
      return ids;
    });
    await this.reviews.clearDecisions(restored, "transfer_suspicion");
  }

  async dismissPair(familyId: number, outflowId: number, inflowId: number): Promise<void> {
    if (!(await this.reviews.allBelongToFamily(familyId, [outflowId, inflowId]))) throw new InvalidTransferReviewError("El movimiento no existe.");
    await this.reviews.rejectPair(outflowId, inflowId);
    await this.reviews.recordDecision(familyId, outflowId, "transfer_suspicion", "not_a_transfer");
    await this.reviews.recordDecision(familyId, inflowId, "transfer_suspicion", "not_a_transfer");
  }

  async dismissSingle(familyId: number, transactionId: number): Promise<void> {
    if (!(await this.reviews.allBelongToFamily(familyId, [transactionId]))) throw new InvalidTransferReviewError("El movimiento no existe.");
    await this.reviews.recordDecision(familyId, transactionId, "transfer_suspicion", "not_a_transfer");
  }

  private async restoreAsStandard(ops: LedgerOperations, tx: TransactionRecord, familyId: number): Promise<void> {
    await ops.updateTransactionKind(tx.id, "standard");
    await applyAggregateDelta(ops, {
      familyId,
      accountId: tx.accountId,
      date: tx.date,
      amountCents: tx.amountCents,
      categoryId: tx.categoryId ?? null,
      kind: "standard",
      flow: classifyFlow(tx.amountCents),
    });
  }

  private async requireStandard(ops: LedgerOperations, id: number): Promise<TransactionRecord> {
    const tx = await ops.getTransaction(id);
    if (!tx) throw new InvalidTransferReviewError("El movimiento no existe.");
    if (tx.kind !== "standard") throw new InvalidTransferReviewError("El movimiento ya no es un gasto o ingreso normal (alguien ya lo reclasificó).");
    return tx;
  }

  private async reclassify(ops: LedgerOperations, tx: TransactionRecord, familyId: number, kind: SuggestedTransferKind): Promise<void> {
    await applyAggregateDelta(ops, {
      familyId,
      accountId: tx.accountId,
      date: tx.date,
      amountCents: -tx.amountCents,
      categoryId: tx.categoryId ?? null,
      kind: tx.kind,
      flow: classifyFlow(tx.amountCents),
    });
    await ops.updateTransactionKind(tx.id, kind);
  }
}
