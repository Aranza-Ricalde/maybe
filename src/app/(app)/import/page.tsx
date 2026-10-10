import { requireUser } from "@/app/lib/dal";
import { ImportPageTemplate } from "@/components/templates/ImportPageTemplate";
import { getImportPageUseCase } from "@/infrastructure/container";
import { dismissStatementInbox } from "./actions";

export default async function ImportPage() {
  const user = await requireUser();
  const data = await getImportPageUseCase.execute(user.familyId);
  return <ImportPageTemplate {...data} dismissStatementAction={dismissStatementInbox} />;
}
