"use client";

import type { FormAction } from "@/lib/actionResult";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SettingsRow } from "@/components/molecules/SettingsRow";
import { SectionNav } from "@/components/molecules/SectionNav";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { parentOptionsForNew } from "@/lib/presenters/categories";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "@/lib/presenters/settings";
import { PayPeriodModal } from "@/components/molecules/PayPeriodModal";
import { PeriodViewSwitch } from "@/components/molecules/PeriodViewSwitch";
import { AccentPicker } from "@/components/molecules/AccentPicker";
import { ThemeSwitch } from "@/components/molecules/ThemeSwitch";
import { TelegramLinkInfo } from "@/components/molecules/TelegramLinkInfo";
import { CategoriesTable, type CategoryRow } from "@/components/organisms/CategoriesTable";
import { CategoryModal } from "@/components/organisms/CategoryModal";
import { PushDeviceCard } from "@/components/organisms/PushDeviceCard";
import { ApiTokenCard, type ApiTokenState, type ApiTokenView } from "@/components/organisms/ApiTokenCard";
import { PayMonthsTable, type PayMonthRow } from "@/components/organisms/PayMonthsTable";
import { PayPeriodsTable, type PayPeriodRow } from "@/components/organisms/PayPeriodsTable";
import type { PeriodView } from "@/domain/payPeriod/periodView";

export interface SettingsPageTemplateProps {
  initialSection: SettingsSectionId;
  userName: string;
  userEmail: string | undefined;
  isTelegramLinked: boolean;
  telegramLinkCode: string;
  apiToken: ApiTokenView | null;
  apiOrigin: string;
  pushPublicKey: string | null;
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
  initialSection,
  userName,
  userEmail,
  isTelegramLinked,
  telegramLinkCode,
  apiToken,
  apiOrigin,
  pushPublicKey,
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
  const { section, select } = useSettingsSection(initialSection);

  return (
    <>
      <PageHeader title="Configuración" />

      <div className="flex flex-col gap-6 md:flex-row md:gap-12">
        <SectionNav items={SETTINGS_SECTIONS.map(({ id, label }) => ({ value: id, label }))} value={section} onChange={select} ariaLabel="Secciones de configuración" />

        <div className="min-w-0 flex-1 text-sm">
          {section === "cuenta" && (
            <SettingsSection title="Cuenta" description="Tus datos y tu enlace con Telegram.">
              <SettingsRow title="Nombre">{userName}</SettingsRow>
              <SettingsRow title="Correo">{userEmail}</SettingsRow>
              <SettingsRow title="Telegram" description="Registra movimientos desde el chat.">
                <TelegramLinkInfo isLinked={isTelegramLinked} linkCode={telegramLinkCode} />
              </SettingsRow>
            </SettingsSection>
          )}

          {section === "apariencia" && (
            <SettingsSection title="Apariencia" description="Elige el tema de la app; “Sistema” sigue el de tu dispositivo.">
              <SettingsRow title="Tema">
                <ThemeSwitch />
              </SettingsRow>
              <SettingsRow title="Color de acento" description="Se usa en botones, enlaces y gráficas. Se guarda en este navegador.">
                <AccentPicker />
              </SettingsRow>
            </SettingsSection>
          )}

          {section === "notificaciones" && (
            <SettingsSection title="Notificaciones" description="Dónde quieres recibir tus avisos de pagos, presupuestos y pendientes.">
              <SettingsRow title="Este dispositivo" description="Notificaciones push, como una app.">
                <PushDeviceCard publicKey={pushPublicKey} />
              </SettingsRow>
              <SettingsRow title="Telegram" description="Los avisos también llegan a tu chat vinculado.">
                <TelegramLinkInfo isLinked={isTelegramLinked} linkCode={telegramLinkCode} />
              </SettingsRow>
            </SettingsSection>
          )}

          {section === "integraciones" && (
            <SettingsSection title="Integraciones" description="Registra movimientos desde tu teléfono.">
              <ApiTokenCard info={apiToken} origin={apiOrigin} generateAction={generateApiTokenAction} />
            </SettingsSection>
          )}

          {section === "categorias" && (
            <SettingsSection
              title="Categorías"
              description="Cómo se clasifican tus movimientos."
              action={<CategoryModal mode="create" action={createCategoryAction} parentOptions={parentOptionsForNew(categories)} />}
            >
              <CategoriesTable rows={categories} updateAction={updateCategoryAction} deleteAction={deleteCategoryAction} />
            </SettingsSection>
          )}

          {section === "periodos" && (
            <SettingsSection title="Periodos" description="Cómo agrupas tu dinero en el tiempo. Los presupuestos, el Resumen y las Estadísticas usan estos periodos.">
              <SettingsRow title="Vista de periodos" description="Mensual usa tus meses de pago; quincenal, tus quincenas.">
                <PeriodViewSwitch value={periodView} action={setPeriodViewAction} />
              </SettingsRow>
              <SettingsRow
                title={periodView === "monthly" ? "Meses de pago" : "Periodos de pago"}
                description={periodView === "monthly" ? "Cada mes agrupa las quincenas que terminan en él. Para agregar o quitar quincenas cambia a la vista Quincenal." : undefined}
              >
                <div className="flex flex-col gap-3">
                  {periodView === "biweekly" && (
                    <div className="flex justify-end">
                      <PayPeriodModal mode="create" action={createPeriodAction} defaultStart={nextPeriodDefaultStart} defaultEnd={nextPeriodDefaultEnd} />
                    </div>
                  )}
                  {periodView === "monthly" ? <PayMonthsTable rows={months} updateAction={updatePayMonthAction} /> : <PayPeriodsTable rows={periods} updateAction={updatePeriodAction} deleteAction={deletePeriodAction} />}
                </div>
              </SettingsRow>
            </SettingsSection>
          )}
        </div>
      </div>
    </>
  );
}

function SettingsSection({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card aria-labelledby={`settings-${title}`}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`settings-${title}`} className="text-lg leading-snug font-medium">
            {title}
          </h2>
          {description && <CardDescription className="mt-1 max-w-xl">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col">{children}</CardContent>
    </Card>
  );
}
