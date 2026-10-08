import type { ConceptSuggestionView, RecurringCandidateView } from "@/components/viewModels";
import type { Insight } from "@/domain/insights/rules";
import { formatCurrency } from "@/lib/format";

export type DecisionKind = "recurring" | "concept";

export interface AttentionDecision {
  key: string;
  id: number;
  kind: DecisionKind;
  title: string;
  detail: string;
}

export function buildDecisions(candidates: RecurringCandidateView[], suggestions: ConceptSuggestionView[]): AttentionDecision[] {
  return [
    ...candidates.map((candidate): AttentionDecision => ({ key: `r${candidate.id}`, id: candidate.id, kind: "recurring", title: `¿${candidate.suggestedName} es un gasto recurrente?`, detail: `Unos ${formatCurrency(candidate.suggestedAmountCents)} al mes` })),
    ...suggestions.map((suggestion): AttentionDecision => ({ key: `c${suggestion.id}`, id: suggestion.id, kind: "concept", title: `¿${suggestion.transactionName} es ${suggestion.conceptName}?`, detail: `${formatCurrency(suggestion.transactionAmountCents)} el ${suggestion.transactionDate}` })),
  ];
}

export const VISIBLE_INSIGHTS = 4;

export function splitInsights(insights: Insight[], visible = VISIBLE_INSIGHTS): { top: Insight[]; rest: Insight[] } {
  const ranked = [...insights].sort((a, b) => b.weight - a.weight);
  return { top: ranked.slice(0, visible), rest: ranked.slice(visible) };
}
