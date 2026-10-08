import type { FormAction } from "@/lib/actionResult";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageSection } from "@/components/molecules/PageSection";
import { PayPeriodModal } from "@/components/molecules/PayPeriodModal";
import { PeriodViewSwitch } from "@/components/molecules/PeriodViewSwitch";
import { ThemeSwitch } from "@/components/molecules/ThemeSwitch";
import { TelegramLinkInfo } from "@/components/molecules/TelegramLinkInfo";
import { CategoriesTable, type CategoryRow } from "@/components/organisms/CategoriesTable";
import { CategoryModal } from "@/components/organisms/CategoryModal";
import { ApiTokenCard, type ApiTokenState, type ApiTokenView } from "@/components/organisms/ApiTokenCard";
import { PayMonthsTable, type PayMonthRow } from "@/components/organisms/PayMonthsTable";
import { PayPeriodsTable, type PayPeriodRow } from "@/components/organisms/PayPeriodsTable";
import type { PeriodView } from "@/domain/payPeriod/periodView";

export interface SettingsPageTemplateProps {
  userName: string;
  userEmail: string | undefined;
  isTelegramLinked: boolean;
  telegramLinkCode: string;
  apiToken: ApiTokenView | null;
  apiOrigin: string;
  generateApiTokenAction: (previous: ApiTokenState, formData: FormData) => Promise<ApiTokenState>;
  categories: CategoryRow[];
  createCategoryAction: FormAction;
  updateCategoryAction: FormAction;
  deleteCategoryAction: FormAction;
  periods: PayPeriodRow[];
  months: PayMonthRow[];
  periodView: PeriodView;
  setPeriodViewAction: FormAction;
  updatePayMonthAction: FormAction;
  nextPeriodDefaultStart: string;
  nextPeriodDefaultEnd: string;
  createPeriodAction: FormAction;
  updatePeriodAction: FormAction;
  deletePeriodAction: FormAction;
}

export function SettingsPageTemplate({
  userName,
  userEmail,
  isTelegramLinked,
  telegramLinkCode,
  apiToken,
  apiOrigin,
  generateApiTokenAction,
  categories,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  periods,
  months,
  periodView,
  setPeriodViewAction,
  updatePayMonthAction,
  nextPeriodDefaultStart,
  nextPeriodDefaultEnd,
  createPeriodAction,
  updatePeriodAction,
  deletePeriodAction,
}: SettingsPageTemplateProps) {
  return (
    <>
      <PageHeader title="Configuración" />

      <PageSection id="cuenta" title="Cuenta" description="Tus datos y cómo se ve la app.">
        <Card>
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nombre:</span> {userName}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {userEmail}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Telegram:</span>
              <TelegramLinkInfo isLinked={isTelegramLinked} linkCode={telegramLinkCode} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>Elige el tema de la app; “Sistema” sigue el de tu dispositivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitch />
          </CardContent>
        </Card>

      </PageSection>

      <PageSection id="integraciones" title="Integraciones" description="Registra movimientos desde tu teléfono.">
        <ApiTokenCard info={apiToken} origin={apiOrigin} generateAction={generateApiTokenAction} />
      </PageSection>

      <PageSection id="categorias" title="Categorías" description="Cómo se clasifican tus movimientos.">
        <Card>
          <CardHeader className="items-center justify-between">
            <CardTitle>Categorías</CardTitle>
            <CategoryModal
              mode="create"
              action={createCategoryAction}
              parentOptions={categories.filter((c) => c.depth === 0).map((c) => ({ value: String(c.id), label: c.name }))}
            />
          </CardHeader>
          <CardContent>
            <CategoriesTable rows={categories} updateAction={updateCategoryAction} deleteAction={deleteCategoryAction} />
          </CardContent>
        </Card>

      </PageSection>

      <PageSection id="periodos" title="Periodos" description="Cómo agrupas tu dinero en el tiempo.">
        <Card>
          <CardHeader>
            <CardTitle>Cómo ver tus periodos</CardTitle>
          </CardHeader>
          <CardContent>
            <PeriodViewSwitch value={periodView} action={setPeriodViewAction} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="items-center justify-between">
            <CardTitle>{periodView === "monthly" ? "Meses de pago" : "Periodos de pago"}</CardTitle>
            {periodView === "biweekly" && <PayPeriodModal mode="create" action={createPeriodAction} defaultStart={nextPeriodDefaultStart} defaultEnd={nextPeriodDefaultEnd} />}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {periodView === "monthly" ? (
              <>
                <p className="text-sm text-muted-foreground">Cada mes agrupa las quincenas que terminan en él. Edita las fechas de inicio y fin del mes; para agregar o quitar quincenas cambia a la vista Quincenal.</p>
                <PayMonthsTable rows={months} updateAction={updatePayMonthAction} />
              </>
            ) : (
              <PayPeriodsTable rows={periods} updateAction={updatePeriodAction} deleteAction={deletePeriodAction} />
            )}
          </CardContent>
        </Card>
      </PageSection>
    </>
  );
}
