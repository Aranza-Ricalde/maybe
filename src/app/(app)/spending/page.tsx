import { requireUser } from "@/app/lib/dal";
import { SpendingPageTemplate } from "@/components/templates/SpendingPageTemplate";
import { getSpendingPageUseCase } from "@/infrastructure/container";
import { todayIso } from "@/lib/today";
import { loadExplorerAction } from "../actions";
import { dissolveSubscriptionGroup, mergeSubscriptions } from "./actions";

export default async function SpendingPage() {
  const user = await requireUser();
  const data = await getSpendingPageUseCase.execute(user.familyId, todayIso());

  return <SpendingPageTemplate {...data} loadExplorerAction={loadExplorerAction} mergeSubscriptionsAction={mergeSubscriptions} dissolveSubscriptionAction={dissolveSubscriptionGroup} />;
}
