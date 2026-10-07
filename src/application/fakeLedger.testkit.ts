import type { AccountSummary, LedgerOperations, LedgerUnitOfWork, NewTransactionInput, TransactionEditInput, TransactionRecord } from "@/domain/ledger/ports";

export class FakeLedger implements LedgerUnitOfWork, LedgerOperations {
  readonly accounts = new Map<number, AccountSummary>();
  readonly transactions = new Map<number, TransactionRecord>();
  readonly balances = new Map<number, number>();
  readonly categoryTotals = new Map<string, number>();
  readonly incomeExpense = new Map<string, { income: number; expense: number }>();
  readonly transfers: Array<[number, number]> = [];
  protected nextId = 1;

  addAccount(id: number, options: { familyId?: number; isActive?: boolean } = {}): this {
    this.accounts.set(id, { id, familyId: options.familyId ?? 1, isActive: options.isActive ?? true });
    return this;
  }

  balanceOf(accountId: number): number {
    return this.balances.get(accountId) ?? 0;
  }

  monthTotals(month: string): { income: number; expense: number } {
    return this.incomeExpense.get(month) ?? { income: 0, expense: 0 };
  }

  run<T>(fn: (ops: LedgerOperations) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async getAccount(accountId: number) {
    return this.accounts.get(accountId) ?? null;
  }

  async getTransaction(id: number) {
    return this.transactions.get(id) ?? null;
  }

  async insertTransaction(input: NewTransactionInput) {
    const record: TransactionRecord = { ...input, id: this.nextId++, kind: input.kind ?? "standard", status: input.status ?? "posted" };
    this.transactions.set(record.id, record);
    return record;
  }

  async updateTransactionRow(id: number, fields: TransactionEditInput) {
    const updated = { ...(this.transactions.get(id) as TransactionRecord), ...fields };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransactionRow(id: number) {
    this.transactions.delete(id);
  }

  async updateTransactionKind(id: number, kind: TransactionRecord["kind"]) {
    this.transactions.set(id, { ...(this.transactions.get(id) as TransactionRecord), kind });
  }

  async applyAccountBalanceDelta(accountId: number, _date: string, deltaCents: number) {
    this.balances.set(accountId, this.balanceOf(accountId) + deltaCents);
  }

  async applyCategoryMonthlyDelta(_familyId: number, categoryId: number, month: string, deltaCents: number) {
    const key = `${categoryId}|${month}`;
    this.categoryTotals.set(key, (this.categoryTotals.get(key) ?? 0) + deltaCents);
  }

  async applyIncomeExpenseMonthlyDelta(_familyId: number, month: string, incomeDeltaCents: number, expenseDeltaCents: number) {
    const current = this.monthTotals(month);
    this.incomeExpense.set(month, { income: current.income + incomeDeltaCents, expense: current.expense + expenseDeltaCents });
  }

  async findPossibleDuplicates(accountId: number, amountCents: number) {
    return [...this.transactions.values()].filter((t) => t.accountId === accountId && t.amountCents === amountCents);
  }

  async linkTransfer(outflowTransactionId: number, inflowTransactionId: number) {
    this.transfers.push([outflowTransactionId, inflowTransactionId]);
  }

  async findTransferPartner(transactionId: number) {
    const pair = this.transfers.find(([out, inn]) => out === transactionId || inn === transactionId);
    return pair ? (pair[0] === transactionId ? pair[1] : pair[0]) : null;
  }

  async unlinkTransfer(transactionId: number) {
    const index = this.transfers.findIndex(([out, inn]) => out === transactionId || inn === transactionId);
    if (index >= 0) this.transfers.splice(index, 1);
  }
}
