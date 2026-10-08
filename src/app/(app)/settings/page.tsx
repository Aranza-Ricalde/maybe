import { getSettingsPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { requestOrigin } from "@/app/lib/origin";
import { SettingsPageTemplate } from "@/components/templates/SettingsPageTemplate";
import { SETTINGS_SECTION_PARAM, parseSettingsSection } from "@/lib/presenters/settings";
import { todayIso } from "@/lib/today";
import { createCategory, createPeriod, deleteCategory, generateApiTokenAction, deletePeriod, setPeriodView, updateCategory, updatePayMonth, updatePeriod } from "./actions";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { [SETTINGS_SECTION_PARAM]: section } = await searchParams;
  const user = await requireUser();
  const data = await getSettingsPageUseCase.execute(user, todayIso());

  return (
    <SettingsPageTemplate
      {...data}
      initialSection={parseSettingsSection(section)}
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
