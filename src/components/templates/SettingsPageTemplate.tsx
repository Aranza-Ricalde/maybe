import { Card } from "@heroui/react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PayPeriodModal } from "@/components/molecules/PayPeriodModal";
import { TelegramLinkInfo } from "@/components/molecules/TelegramLinkInfo";
import { CategoriesTable, type CategoryRow } from "@/components/organisms/CategoriesTable";
import { CategoryModal } from "@/components/organisms/CategoryModal";
import { ApiTokenCard, type ApiTokenState, type ApiTokenView } from "@/components/organisms/ApiTokenCard";
import { PayPeriodsTable, type PayPeriodRow } from "@/components/organisms/PayPeriodsTable";

export interface SettingsPageTemplateProps {
  userName: string;
  userEmail: string | undefined;
  isTelegramLinked: boolean;
  telegramLinkCode: string;
  apiToken: ApiTokenView | null;
  apiOrigin: string;
  generateApiTokenAction: (previous: ApiTokenState, formData: FormData) => Promise<ApiTokenState>;
  categories: CategoryRow[];
  createCategoryAction: (formData: FormData) => Promise<void> | void;
  updateCategoryAction: (formData: FormData) => Promise<void> | void;
  deleteCategoryAction: (formData: FormData) => Promise<void> | void;
  periods: PayPeriodRow[];
  nextPeriodDefaultStart: string;
  nextPeriodDefaultEnd: string;
  createPeriodAction: (formData: FormData) => Promise<void> | void;
  updatePeriodAction: (formData: FormData) => Promise<void> | void;
  deletePeriodAction: (formData: FormData) => Promise<void> | void;
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
  nextPeriodDefaultStart,
  nextPeriodDefaultEnd,
  createPeriodAction,
  updatePeriodAction,
  deletePeriodAction,
}: SettingsPageTemplateProps) {
  return (
    <>
      <PageHeader title="Configuración" />

      <Card className="p-5">
        <Card.Header>
          <Card.Title>Tu cuenta</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted">Nombre:</span> {userName}
          </p>
          <p>
            <span className="text-muted">Email:</span> {userEmail}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-muted">Telegram:</span>
            <TelegramLinkInfo isLinked={isTelegramLinked} linkCode={telegramLinkCode} />
          </div>
        </Card.Content>
      </Card>

      <ApiTokenCard info={apiToken} origin={apiOrigin} generateAction={generateApiTokenAction} />

      <Card className="p-5">
        <Card.Header className="flex-row! items-center justify-between">
          <Card.Title>Categorías</Card.Title>
          <CategoryModal
            mode="create"
            action={createCategoryAction}
            parentOptions={categories.filter((c) => c.depth === 0).map((c) => ({ value: String(c.id), label: c.name }))}
          />
        </Card.Header>
        <Card.Content>
          <CategoriesTable rows={categories} updateAction={updateCategoryAction} deleteAction={deleteCategoryAction} />
        </Card.Content>
      </Card>

      <Card className="p-5">
        <Card.Header className="flex-row! items-center justify-between">
          <Card.Title>Periodos de pago</Card.Title>
          <PayPeriodModal mode="create" action={createPeriodAction} defaultStart={nextPeriodDefaultStart} defaultEnd={nextPeriodDefaultEnd} />
        </Card.Header>
        <Card.Content>
          <PayPeriodsTable rows={periods} updateAction={updatePeriodAction} deleteAction={deletePeriodAction} />
        </Card.Content>
      </Card>
    </>
  );
}
