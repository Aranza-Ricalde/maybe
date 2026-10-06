import { Card } from "@heroui/react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { GoalModal } from "@/components/organisms/GoalModal";
import { GoalsTable, type GoalRow } from "@/components/organisms/GoalsTable";
import type { AccountOption } from "@/components/viewModels";

export interface GoalsPageTemplateProps {
  rows: GoalRow[];
  accounts: AccountOption[];
  createAction: (formData: FormData) => Promise<void> | void;
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
}

export function GoalsPageTemplate({ rows, accounts, createAction, updateAction, deleteAction }: GoalsPageTemplateProps) {
  return (
    <>
      <PageHeader title="Metas" subtitle="Tus objetivos de ahorro." action={<GoalModal mode="create" accounts={accounts} action={createAction} />} />

      {rows.length === 0 ? (
        <Card className="p-5">
          <EmptyState title="Sin metas todavía" description="Crea tu primera meta de ahorro arriba." />
        </Card>
      ) : (
        <GoalsTable rows={rows} accounts={accounts} updateAction={updateAction} deleteAction={deleteAction} />
      )}
    </>
  );
}
