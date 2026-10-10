import type { FamilyOwnership } from "@/domain/auth/ownership";
import { assertValidAmountCents, assertValidIsoDate, assertValidTransactionName, classifyFlow, type TransactionKind } from "@/domain/ledger/rules";
import type { StatementRowDecision } from "@/domain/statements/decisions";
import { StatementImportCancelledError } from "@/domain/statements/importControl";
import type { StatementImportOperations, StatementImportUnitOfWork } from "@/domain/statements/ports";
import type { PairKind, PreviewRow } from "@/domain/statements/reconcile";
import {
  InvalidStatementDecisionError,
  StatementAlreadyImportedError,
  StatementTotalsMismatchError,
  type ParsedStatement,
  type StatementTransactionType,
} from "@/domain/statements/types";
import { applyAggregateDelta, applyTransactionDelta } from "./applyTransactionDelta";
import type { ReconcileStatementUseCase } from "./reconcileStatement";

export type RowDecision = StatementRowDecision;

export interface ConfirmStatementInput {
  familyId: number;
  accountId: number;
  statement: ParsedStatement;
  decisions: RowDecision[];
  acknowledgeMismatch: boolean;
  signal?: AbortSignal;
}

export interface ConfirmStatementResult {
  importId: number;
  imported: number;
  linked: number;
  skipped: number;
  paired: number;
  insertedTransactionIds: number[];
}

const KIND_OF_TYPE: Record<StatementTransactionType, TransactionKind> = { expense: "standard", income: "standard", internal_transfer: "transfer", card_payment: "cc_payment" };

interface PlannedImport {
  row: PreviewRow;
  type: StatementTransactionType;
  categoryId: number | null;
  pairWith: { transactionId: number; kind: PairKind } | null;
}

interface PlannedLink {
  row: PreviewRow;
  transactionId: number;
  pairWith: { transactionId: number; kind: PairKind } | null;
}

const foreignNote = (row: PreviewRow) => (row.transaction.foreign ? `Cargo en ${row.transaction.foreign.currency} ${row.transaction.foreign.amountText} (tipo de cambio ${row.transaction.foreign.exchangeRateText})` : null);

export class ConfirmStatementImportUseCase {
  constructor(
    private readonly reconcile: ReconcileStatementUseCase,
    private readonly uow: StatementImportUnitOfWork,
    private readonly ownership: FamilyOwnership,
  ) {}

  async execute(input: ConfirmStatementInput): Promise<ConfirmStatementResult> {
    const { familyId, accountId, statement } = input;
    const totalsMatch = statement.validation.checks.every((check) => check.expected === check.actual);
    if (!totalsMatch && !input.acknowledgeMismatch) throw new StatementTotalsMismatchError("Los totales del estado no cuadran con lo leído; confirma explícitamente para importar de todos modos.");

    const preview = await this.reconcile.execute(familyId, accountId, statement);
    const decisions = new Map<number, RowDecision>();
    for (const decision of input.decisions) {
      if (!Number.isInteger(decision.index) || decision.index < 0 || decision.index >= preview.rows.length || decisions.has(decision.index)) throw new InvalidStatementDecisionError("Hay una decisión inválida o repetida.");
      decisions.set(decision.index, decision);
    }

    const imports: PlannedImport[] = [];
    const links: PlannedLink[] = [];
    let skipped = 0;
    for (const row of preview.rows) {
      if (row.locked) continue;
      const decision = decisions.get(row.index);
      const action = decision?.action ?? row.defaultAction;
      if (action === "skip") {
        skipped++;
        continue;
      }

      const pairWith = await this.resolvePair(row, decision);
      if (action === "link") {
        if (row.status !== "probable_match" || !row.match || (decision?.linkTransactionId != null && decision.linkTransactionId !== row.match.transactionId)) throw new InvalidStatementDecisionError("Ese movimiento no se puede vincular.");
        links.push({ row, transactionId: row.match.transactionId, pairWith });
        continue;
      }

      const type = decision?.typeOverride ?? row.transaction.type;
      if (pairWith && type !== "internal_transfer" && type !== "card_payment") throw new InvalidStatementDecisionError("Solo una transferencia o un pago de tarjeta se puede emparejar.");
      const categoryId = decision?.categoryId ?? null;
      if (categoryId != null && (type === "internal_transfer" || type === "card_payment" || !(await this.ownership.owns("category", categoryId, familyId)))) throw new InvalidStatementDecisionError("La categoría elegida no es válida para este movimiento.");
      imports.push({ row, type, categoryId, pairWith });
    }

    const insertedTransactionIds: number[] = [];
    let paired = 0;
    const importId = await this.uow.run(async (ops) => {
      const present = await ops.existingHashes(accountId, [...imports, ...links].map((p) => p.row.hash));
      if (present.length > 0) throw new StatementAlreadyImportedError("Alguno de estos movimientos ya se importó; vuelve a revisar el estado.");

      const importId = await ops.insertImportRecord({
        familyId,
        bank: statement.bank,
        accountId,
        accountLast4: statement.accountLast4,
        periodStart: statement.periodStart,
        periodEnd: statement.periodEnd,
        transactionCount: imports.length,
        linkedCount: links.length,
        metadata: statement.metadata,
      });

      const pairs: Array<{ transactionId: number; counterpartId: number; kind: PairKind }> = [];
      for (const planned of imports) {
        const id = await this.insert(ops, familyId, accountId, importId, planned);
        insertedTransactionIds.push(id);
        if (planned.pairWith) pairs.push({ transactionId: id, counterpartId: planned.pairWith.transactionId, kind: planned.pairWith.kind });
      }
      for (const planned of links) {
        const existing = await ops.getTransaction(planned.transactionId);
        if (!existing || existing.accountId !== accountId || existing.importHash) throw new InvalidStatementDecisionError("El movimiento ya no está disponible para vincular; vuelve a revisar el estado.");
        await ops.linkStatementRow(planned.transactionId, { importHash: planned.row.hash, importId, postedDate: planned.row.transaction.postedDate ?? null });
        if (planned.pairWith) pairs.push({ transactionId: planned.transactionId, counterpartId: planned.pairWith.transactionId, kind: planned.pairWith.kind });
      }
      for (const pair of pairs) if (await this.linkPair(ops, familyId, pair)) paired++;
      if (input.signal?.aborted) throw new StatementImportCancelledError();
      return importId;
    });

    return { importId, imported: imports.length, linked: links.length, skipped, paired, insertedTransactionIds };
  }

  private async resolvePair(row: PreviewRow, decision: RowDecision | undefined): Promise<{ transactionId: number; kind: PairKind } | null> {
    if (decision?.pairWithTransactionId == null) return null;
    if (!row.pairSuggestion || row.pairSuggestion.transactionId !== decision.pairWithTransactionId) throw new InvalidStatementDecisionError("Ese movimiento no se puede emparejar con el elegido.");
    return { transactionId: row.pairSuggestion.transactionId, kind: row.pairSuggestion.kind };
  }

  private async insert(ops: StatementImportOperations, familyId: number, accountId: number, importId: number, { row, type, categoryId }: PlannedImport): Promise<number> {
    const { date, postedDate, description, amountCents } = row.transaction;
    assertValidAmountCents(amountCents);
    assertValidIsoDate(date);
    assertValidTransactionName(description);
    const kind = KIND_OF_TYPE[type];
    const record = await ops.insertTransaction({
      accountId,
      date,
      amountCents,
      name: description,
      rawDescription: description,
      categoryId,
      notes: foreignNote(row),
      kind,
      status: "posted",
      source: "statement_import",
      importId,
      importHash: row.hash,
      postedDate: postedDate ?? null,
      reconciled: true,
    });
    await applyTransactionDelta(ops, { familyId, accountId, date, amountCents, categoryId, kind, flow: classifyFlow(amountCents) });
    return record.id;
  }

  private async linkPair(ops: StatementImportOperations, familyId: number, pair: { transactionId: number; counterpartId: number; kind: PairKind }): Promise<boolean> {
    const [mine, theirs] = await Promise.all([ops.getTransaction(pair.transactionId), ops.getTransaction(pair.counterpartId)]);
    if (!mine || !theirs || mine.amountCents !== -theirs.amountCents || mine.accountId === theirs.accountId) throw new InvalidStatementDecisionError("Los movimientos a emparejar ya no coinciden.");
    const counterpartAccount = await ops.getAccount(theirs.accountId);
    if (counterpartAccount?.familyId !== familyId) throw new InvalidStatementDecisionError("El movimiento a emparejar no existe.");
    if ((await ops.findTransferPartner(mine.id)) != null || (await ops.findTransferPartner(theirs.id)) != null) return false;

    for (const tx of [mine, theirs]) {
      if (tx.kind === pair.kind) continue;
      await applyAggregateDelta(ops, { familyId, accountId: tx.accountId, date: tx.date, amountCents: -tx.amountCents, categoryId: tx.categoryId ?? null, kind: tx.kind, flow: classifyFlow(tx.amountCents) });
      await ops.updateTransactionKind(tx.id, pair.kind);
    }
    const [outflow, inflow] = mine.amountCents < 0 ? [mine, theirs] : [theirs, mine];
    await ops.linkTransfer(outflow.id, inflow.id);
    return true;
  }
}
