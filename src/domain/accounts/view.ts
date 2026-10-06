import { parseDebtTerms, type DebtTerms } from "@/domain/debts/rules";
import type { AccountType } from "./rules";

export interface AccountForView {
  id: number;
  name: string;
  type: AccountType;
  details: unknown;
}

export interface AccountRowView {
  id: number;
  name: string;
  type: AccountType;
  balanceCents: number;
  creditLimitCents: number | null;
  debtTerms: DebtTerms;
}

const asRecord = (details: unknown): Record<string, unknown> | null => (typeof details === "object" && details !== null ? (details as Record<string, unknown>) : null);

export function accountRowsView(accounts: AccountForView[], balanceByAccount: Map<number, number>): AccountRowView[] {
  return accounts.map((account) => {
    const details = asRecord(account.details);
    const creditLimit = details?.creditLimitCents;
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      balanceCents: balanceByAccount.get(account.id) ?? 0,
      creditLimitCents: typeof creditLimit === "number" ? creditLimit : null,
      debtTerms: parseDebtTerms(details),
    };
  });
}
