import type { LedgerOperations, TransactionRecord } from "@/domain/ledger/ports";
import type { NewImportRecord, StatementAccount, StatementContextRepository, StatementHasher, StatementImportOperations, StatementImportUnitOfWork } from "@/domain/statements/ports";
import type { ExistingMovement, OtherAccountMovement, ReconciliationContext } from "@/domain/statements/reconcile";
import { FakeLedger } from "./fakeLedger.testkit";

export const identityHasher: StatementHasher = { hash: (key) => key };

export interface StoredImport extends NewImportRecord {
  id: number;
}

export class FakeStatementWorld extends FakeLedger implements StatementImportOperations, StatementImportUnitOfWork {
  readonly names = new Map<number, string>();
  readonly storedImports: StoredImport[] = [];

  addNamedAccount(id: number, name: string, options: { familyId?: number; isActive?: boolean } = {}): this {
    this.addAccount(id, options);
    this.names.set(id, name);
    return this;
  }

  addManual(input: Partial<TransactionRecord> & { accountId: number; date: string; amountCents: number; name: string }): TransactionRecord {
    const record: TransactionRecord = { kind: "standard", status: "posted", source: "manual", ...input, id: this.nextId++ };
    this.transactions.set(record.id, record);
    this.balances.set(record.accountId, this.balanceOf(record.accountId) + record.amountCents);
    return record;
  }

  async getStatementAccount(familyId: number, accountId: number): Promise<StatementAccount | null> {
    const account = this.accounts.get(accountId);
    return account && account.familyId === familyId ? { id: accountId, name: this.names.get(accountId) ?? `Cuenta ${accountId}`, isActive: account.isActive } : null;
  }

  async loadContext(familyId: number, accountId: number, from: string, to: string): Promise<ReconciliationContext> {
    const all = [...this.transactions.values()];
    const inWindow = (t: TransactionRecord) => t.date >= from && t.date <= to;
    const linked = new Set(this.transfers.flat());
    const existing: ExistingMovement[] = all
      .filter((t) => t.accountId === accountId && inWindow(t))
      .map((t) => ({ id: t.id, date: t.date, postedDate: t.postedDate ?? null, amountCents: t.amountCents, name: t.name, rawDescription: t.rawDescription ?? null, importHash: t.importHash ?? null, source: t.source, categoryId: t.categoryId ?? null }));
    const knownHashes = new Set(all.filter((t) => t.accountId === accountId && t.importHash).map((t) => t.importHash as string));
    const otherAccounts: OtherAccountMovement[] = all
      .filter((t) => t.accountId !== accountId && this.accounts.get(t.accountId)?.familyId === familyId && inWindow(t))
      .map((t) => ({ id: t.id, accountName: this.names.get(t.accountId) ?? `Cuenta ${t.accountId}`, date: t.date, amountCents: t.amountCents, kind: t.kind, linkedTransfer: linked.has(t.id) }));
    return { existing, knownHashes, otherAccounts };
  }

  async existingHashes(accountId: number, hashes: string[]): Promise<string[]> {
    const wanted = new Set(hashes);
    return [...this.transactions.values()].filter((t) => t.accountId === accountId && t.importHash && wanted.has(t.importHash)).map((t) => t.importHash as string);
  }

  async linkStatementRow(transactionId: number, fields: { importHash: string; importId: number; postedDate: string | null }): Promise<void> {
    const current = this.transactions.get(transactionId) as TransactionRecord;
    this.transactions.set(transactionId, { ...current, importHash: fields.importHash, importId: fields.importId, reconciled: true, ...(fields.postedDate ? { postedDate: fields.postedDate } : {}) });
  }

  async findImport(importId: number): Promise<{ familyId: number; accountId: number | null } | null> {
    const found = this.storedImports.find((record) => record.id === importId);
    return found ? { familyId: found.familyId, accountId: found.accountId } : null;
  }

  async listImportTransactions(importId: number): Promise<Array<{ id: number; source: string }>> {
    return [...this.transactions.values()].filter((t) => t.importId === importId).map((t) => ({ id: t.id, source: t.source }));
  }

  async unlinkStatementRow(transactionId: number): Promise<void> {
    const current = this.transactions.get(transactionId) as TransactionRecord;
    this.transactions.set(transactionId, { ...current, importHash: null, importId: null, reconciled: false, postedDate: null });
  }

  async deleteImportRecord(importId: number): Promise<void> {
    const index = this.storedImports.findIndex((record) => record.id === importId);
    if (index >= 0) this.storedImports.splice(index, 1);
  }

  async insertImportRecord(record: NewImportRecord): Promise<number> {
    const id = this.storedImports.length + 1;
    this.storedImports.push({ ...record, id });
    return id;
  }

  async run<T>(fn: (ops: StatementImportOperations & LedgerOperations) => Promise<T>): Promise<T> {
    const snapshot = {
      transactions: new Map(structuredClone([...this.transactions])),
      balances: new Map(this.balances),
      categoryTotals: new Map(this.categoryTotals),
      incomeExpense: new Map(structuredClone([...this.incomeExpense])),
      transfers: structuredClone(this.transfers),
      imports: structuredClone(this.storedImports),
      nextId: this.nextId,
    };
    try {
      return await fn(this);
    } catch (error) {
      this.transactions.clear();
      snapshot.transactions.forEach((v, k) => this.transactions.set(k, v));
      this.balances.clear();
      snapshot.balances.forEach((v, k) => this.balances.set(k, v));
      this.categoryTotals.clear();
      snapshot.categoryTotals.forEach((v, k) => this.categoryTotals.set(k, v));
      this.incomeExpense.clear();
      snapshot.incomeExpense.forEach((v, k) => this.incomeExpense.set(k, v));
      this.transfers.splice(0, this.transfers.length, ...snapshot.transfers);
      this.storedImports.splice(0, this.storedImports.length, ...snapshot.imports);
      this.nextId = snapshot.nextId;
      throw error;
    }
  }

  contextRepository(): StatementContextRepository {
    return { getAccount: (familyId, accountId) => this.getStatementAccount(familyId, accountId), loadContext: (familyId, accountId, from, to) => this.loadContext(familyId, accountId, from, to) };
  }
}
