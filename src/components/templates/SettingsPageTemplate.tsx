import { Card } from "@heroui/react";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PayPeriodModal } from "@/components/molecules/PayPeriodModal";
import { TelegramLinkInfo } from "@/components/molecules/TelegramLinkInfo";
import { CategoriesTable, type CategoryRow } from "@/components/organisms/CategoriesTable";
import { CategoryModal } from "@/components/organisms/CategoryModal";
import { ConceptModal, type ConceptCategoryOption, type ConceptProviderOption } from "@/components/organisms/ConceptModal";
import { ConceptsTable, type ConceptRow } from "@/components/organisms/ConceptsTable";
import { PayPeriodsTable, type PayPeriodRow } from "@/components/organisms/PayPeriodsTable";
import { ProviderModal } from "@/components/organisms/ProviderModal";
import { ProvidersTable, type ProviderRow } from "@/components/organisms/ProvidersTable";

export interface SettingsPageTemplateProps {
  userName: string;
  userEmail: string | undefined;
  isTelegramLinked: boolean;
  categories: CategoryRow[];
  createCategoryAction: (formData: FormData) => Promise<void> | void;
  updateCategoryAction: (formData: FormData) => Promise<void> | void;
  deleteCategoryAction: (formData: FormData) => Promise<void> | void;
  providers: ProviderRow[];
  createProviderAction: (formData: FormData) => Promise<void> | void;
  updateProviderAction: (formData: FormData) => Promise<void> | void;
  deleteProviderAction: (formData: FormData) => Promise<void> | void;
  concepts: ConceptRow[];
  conceptCategoryOptions: ConceptCategoryOption[];
  conceptProviderOptions: ConceptProviderOption[];
  createConceptAction: (formData: FormData) => Promise<void> | void;
  updateConceptAction: (formData: FormData) => Promise<void> | void;
  deleteConceptAction: (formData: FormData) => Promise<void> | void;
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
  categories,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  providers,
  createProviderAction,
  updateProviderAction,
  deleteProviderAction,
  concepts,
  conceptCategoryOptions,
  conceptProviderOptions,
  createConceptAction,
  updateConceptAction,
  deleteConceptAction,
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
            <TelegramLinkInfo isLinked={isTelegramLinked} />
          </div>
        </Card.Content>
      </Card>

      <Card className="p-5">
        <Card.Header className="flex-row! items-center justify-between">
          <Card.Title>Categorías</Card.Title>
          <CategoryModal mode="create" action={createCategoryAction} />
        </Card.Header>
        <Card.Content>
          <CategoriesTable rows={categories} updateAction={updateCategoryAction} deleteAction={deleteCategoryAction} />
        </Card.Content>
      </Card>

      <Card className="p-5">
        <Card.Header className="flex-row! items-center justify-between">
          <Card.Title>Proveedores</Card.Title>
          <ProviderModal mode="create" action={createProviderAction} />
        </Card.Header>
        <Card.Content>
          <ProvidersTable rows={providers} updateAction={updateProviderAction} deleteAction={deleteProviderAction} />
        </Card.Content>
      </Card>

      <Card className="p-5">
        <Card.Header className="flex-row! items-center justify-between">
          <Card.Title>Conceptos</Card.Title>
          <ConceptModal mode="create" action={createConceptAction} categories={conceptCategoryOptions} providers={conceptProviderOptions} />
        </Card.Header>
        <Card.Content>
          <ConceptsTable
            rows={concepts}
            categories={conceptCategoryOptions}
            providers={conceptProviderOptions}
            updateAction={updateConceptAction}
            deleteAction={deleteConceptAction}
          />
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
