import type { OccurrenceDecision } from "@/domain/recurring/occurrences";
import { FIELD } from "@/lib/formFields";

export function buildDecisionFormData(occurrenceId: number, decision: OccurrenceDecision): FormData {
  const formData = new FormData();
  formData.set(FIELD.occurrenceId, String(occurrenceId));
  formData.set(FIELD.decision, decision);
  return formData;
}
