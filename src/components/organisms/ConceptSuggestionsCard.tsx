import type { FormAction } from "@/lib/actionResult";
import type { ConceptSuggestionView } from "@/components/viewModels";
import { formatCurrency } from "@/lib/format";
import { SuggestionListCard } from "./SuggestionListCard";

export interface ConceptSuggestionsCardProps {
  suggestions: ConceptSuggestionView[];
  confirmAction: FormAction;
  rejectAction: FormAction;
}

export function ConceptSuggestionsCard({ suggestions, confirmAction, rejectAction }: ConceptSuggestionsCardProps) {
  return (
    <SuggestionListCard
      title="Posibles coincidencias"
      description="Creemos que estos movimientos corresponden a un concepto que ya conoces — confirma o ignora."
      items={suggestions.map((s) => ({ id: s.id, title: s.transactionName, detail: `${formatCurrency(s.transactionAmountCents)} el ${s.transactionDate} — ¿Es ${s.conceptName}?` }))}
      confirmAction={confirmAction}
      dismissAction={rejectAction}
    />
  );
}
