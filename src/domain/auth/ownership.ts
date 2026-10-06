export type OwnedResource = "account" | "category" | "goal" | "payPeriod" | "recurringItem" | "recurringCandidate" | "transaction" | "conceptSuggestion";

export interface FamilyOwnership {
  owns(resource: OwnedResource, id: number, familyId: number): Promise<boolean>;
  ownsAllAccounts(accountIds: number[], familyId: number): Promise<boolean>;
}
