export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "credit_card",
  "cash",
  "loan",
  "property",
  "vehicle",
  "other_asset",
  "other_liability",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

const LIABILITY_ACCOUNT_TYPES: readonly AccountType[] = ["credit_card", "loan", "other_liability"];

export function isLiabilityAccountType(type: AccountType): boolean {
  return LIABILITY_ACCOUNT_TYPES.includes(type);
}

export interface AccountForDefaultSelection {
  id: number;
  name: string;
}

export function pickDefaultAccountId(accounts: AccountForDefaultSelection[]): number | null {
  const payroll = accounts.find((a) => /n[oó]mina/i.test(a.name));
  return (payroll ?? accounts[0])?.id ?? null;
}

export class InvalidAccountError extends Error {}

export function assertValidAccountName(name: string): void {
  if (!name.trim()) {
    throw new InvalidAccountError("El nombre de la cuenta no puede estar vacío.");
  }
}

export function assertValidAccountType(type: string): asserts type is AccountType {
  if (!ACCOUNT_TYPES.includes(type as AccountType)) {
    throw new InvalidAccountError(`Tipo de cuenta inválido: "${type}".`);
  }
}

export type AccountRemovalAction = "delete" | "archive";

export function decideAccountRemoval(activityCount: number): AccountRemovalAction {
  return activityCount === 0 ? "delete" : "archive";
}

export function mergeAccountDetails(
  existingDetails: Record<string, unknown> | null,
  creditLimitCents: number | undefined,
): Record<string, unknown> | null {
  if (creditLimitCents == null) return existingDetails;
  return { ...(existingDetails ?? {}), creditLimitCents };
}
