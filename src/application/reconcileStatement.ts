import { importKeys } from "@/domain/statements/hash";
import type { StatementAccount, StatementContextRepository, StatementHasher } from "@/domain/statements/ports";
import { contextWindow, reconcileStatement, type StatementPreview } from "@/domain/statements/reconcile";
import { StatementAccountError, type ParsedStatement } from "@/domain/statements/types";

export async function requireStatementAccount(repo: StatementContextRepository, familyId: number, accountId: number): Promise<StatementAccount> {
  const account = await repo.getAccount(familyId, accountId);
  if (!account) throw new StatementAccountError("La cuenta elegida no existe.");
  if (!account.isActive) throw new StatementAccountError("La cuenta elegida está archivada.");
  return account;
}

export class ReconcileStatementUseCase {
  constructor(
    private readonly context: StatementContextRepository,
    private readonly hasher: StatementHasher,
  ) {}

  async execute(familyId: number, accountId: number, statement: ParsedStatement): Promise<StatementPreview> {
    await requireStatementAccount(this.context, familyId, accountId);
    const window = contextWindow(statement);
    const context = await this.context.loadContext(familyId, accountId, window.from, window.to);
    const hashes = importKeys(statement.bank, statement.accountLast4, statement.transactions).map((key) => this.hasher.hash(key));
    return reconcileStatement(statement, hashes, context);
  }
}
