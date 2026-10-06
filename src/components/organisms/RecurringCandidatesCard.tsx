import type { RecurringCandidateView } from "@/components/viewModels";
import { formatCurrency } from "@/lib/format";
import { SuggestionListCard } from "./SuggestionListCard";

export interface RecurringCandidatesCardProps {
  candidates: RecurringCandidateView[];
  acceptAction: (formData: FormData) => Promise<void> | void;
  dismissAction: (formData: FormData) => Promise<void> | void;
}

export function RecurringCandidatesCard({ candidates, acceptAction, dismissAction }: RecurringCandidatesCardProps) {
  return (
    <SuggestionListCard
      title="Posibles gastos recurrentes"
      description="Detectamos un patrón — confirma si quieres que cuente en tu presupuesto cada mes."
      items={candidates.map((c) => ({ id: c.id, title: c.suggestedName, detail: `${formatCurrency(c.suggestedAmountCents)} aprox. / mes` }))}
      confirmAction={acceptAction}
      dismissAction={dismissAction}
    />
  );
}
