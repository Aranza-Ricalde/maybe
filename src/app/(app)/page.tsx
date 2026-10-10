import { getDashboardPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { DashboardPageTemplate } from "@/components/templates/DashboardPageTemplate";
import {
  confirmConceptSuggestionAction,
  linkPaymentAction,
  listPaymentCandidatesAction,
  rejectConceptSuggestionAction,
  resolveOccurrenceAction,
} from "./actions";
import type { PeriodsSearchParams } from "@/domain/shared/routes";
import { todayIso } from "@/lib/today";
import { acceptCandidate, dismissCandidate } from "./recurring/actions";
import { recordTransfer } from "./transactions/actions";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<PeriodsSearchParams> }) {
  const user = await requireUser();
  const { periods } = await searchParams;
  const data = await getDashboardPageUseCase.execute(user, todayIso(), periods);

  return (
    <DashboardPageTemplate
      data={data}
      today={todayIso()}
      recordTransferAction={recordTransfer}
      calendar={{ decisionAction: resolveOccurrenceAction, listPaymentCandidates: listPaymentCandidatesAction, linkPaymentAction }}
      attentionActions={{ recurring: { confirm: acceptCandidate, dismiss: dismissCandidate }, concept: { confirm: confirmConceptSuggestionAction, dismiss: rejectConceptSuggestionAction } }}
    />
  );
}
