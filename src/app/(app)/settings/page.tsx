import { getSettingsPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { requestOrigin } from "@/app/lib/origin";
import { SettingsPageTemplate } from "@/components/templates/SettingsPageTemplate";
import { todayIso } from "@/lib/today";
import { createCategory, createPeriod, deleteCategory, generateApiTokenAction, deletePeriod, setPeriodView, updateCategory, updatePayMonth, updatePeriod } from "./actions";

export default async function SettingsPage() {
  const user = await requireUser();
  const data = await getSettingsPageUseCase.execute(user, todayIso());

  return (
    <SettingsPageTemplate
      {...data}
      apiOrigin={await requestOrigin()}
      generateApiTokenAction={generateApiTokenAction}
      createCategoryAction={createCategory}
      updateCategoryAction={updateCategory}
      deleteCategoryAction={deleteCategory}
      createPeriodAction={createPeriod}
      updatePeriodAction={updatePeriod}
      deletePeriodAction={deletePeriod}
      setPeriodViewAction={setPeriodView}
      updatePayMonthAction={updatePayMonth}
    />
  );
}
