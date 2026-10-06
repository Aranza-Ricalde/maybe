import type { AccountSummary, LedgerOperations } from "@/domain/ledger/ports";
import { InvalidTransactionError } from "@/domain/ledger/rules";

export async function requireActiveAccount(ops: LedgerOperations, accountId: number): Promise<AccountSummary> {
  const account = await ops.getAccount(accountId);
  if (!account) throw new InvalidTransactionError(`la cuenta ${accountId} no existe`);
  if (!account.isActive) throw new InvalidTransactionError(`la cuenta ${accountId} está inactiva`);
  return account;
}
