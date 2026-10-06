import "server-only";
import type { OwnedResource } from "@/domain/auth/ownership";
import { familyOwnership } from "@/infrastructure/container";

export type OwnershipCheck<I> = (input: I, familyId: number) => Promise<boolean>;

function ownershipOf(resource: OwnedResource) {
  return <I>(pick: (input: I) => number | null | undefined): OwnershipCheck<I> =>
    async (input, familyId) => {
      const id = pick(input);
      return id == null ? true : familyOwnership.owns(resource, id, familyId);
    };
}

export const ownsAccount = ownershipOf("account");
export const ownsCategory = ownershipOf("category");
export const ownsGoal = ownershipOf("goal");
export const ownsPayPeriod = ownershipOf("payPeriod");
export const ownsRecurringItem = ownershipOf("recurringItem");
export const ownsRecurringCandidate = ownershipOf("recurringCandidate");
export const ownsTransaction = ownershipOf("transaction");
export const ownsConceptSuggestion = ownershipOf("conceptSuggestion");

export function ownsAccounts<I>(pick: (input: I) => number[]): OwnershipCheck<I> {
  return (input, familyId) => familyOwnership.ownsAllAccounts(pick(input), familyId);
}
