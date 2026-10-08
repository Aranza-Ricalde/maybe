import type { FormAction } from "@/lib/actionResult";
import { useState, useTransition } from "react";
import type { PaymentCandidateView } from "@/components/molecules/OccurrencePaymentPicker";
import type { OccurrenceDecision } from "@/domain/recurring/occurrences";
import { useFeedbackAction } from "./useFeedbackAction";
import { buildDecisionFormData } from "@/lib/presenters/occurrenceDecision";

export interface UseOccurrenceActionsOptions {
  occurrenceId: number | null;
  decisionAction: FormAction;
  listPaymentCandidates: (occurrenceId: number) => Promise<PaymentCandidateView[]>;
}

export function useOccurrenceActions({ occurrenceId, decisionAction, listPaymentCandidates }: UseOccurrenceActionsOptions) {
  const decision = useFeedbackAction(decisionAction);
  const [pickerPending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<PaymentCandidateView[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  return {
    isPending: decision.isPending || pickerPending,
    candidates,
    pickerOpen,
    setPickerOpen,
    decide: (choice: OccurrenceDecision) => {
      if (occurrenceId == null) return;
      decision.run(buildDecisionFormData(occurrenceId, choice));
    },
    openPicker: () => {
      if (occurrenceId == null) return;
      startTransition(async () => {
        setCandidates(await listPaymentCandidates(occurrenceId));
        setPickerOpen(true);
      });
    },
  };
}
