import type { TransactionConceptResolver } from "@/domain/matching/ports";
import { logFailure } from "@/lib/log";

export async function resolveConceptQuietly(resolver: TransactionConceptResolver | undefined, transactionId: number, familyId: number, context: string): Promise<void> {
  try {
    await resolver?.execute(transactionId, familyId);
  } catch (error) {
    logFailure(`resolveTransactionConcept falló (${context})`, error);
  }
}
