import type { FormAction } from "@/lib/actionResult";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import type { EmergencyFundView } from "@/application/getEmergencyFund";
import { EmergencyFundCard } from "@/components/organisms/EmergencyFundCard";
import { GoalModal } from "@/components/organisms/GoalModal";
import { GoalRingsChart } from "@/components/organisms/GoalRingsChart";
import { goalRings } from "@/lib/presenters/charts";
import { GoalsTable, type GoalRow } from "@/components/organisms/GoalsTable";
import type { AccountOption } from "@/components/viewModels";

export interface GoalsPageTemplateProps {
  rows: GoalRow[];
  accounts: AccountOption[];
  emergencyFund: EmergencyFundView;
  createAction: FormAction;
  updateAction: FormAction;
  deleteAction: FormAction;
}

export function GoalsPageTemplate({ rows, accounts, emergencyFund, createAction, updateAction, deleteAction }: GoalsPageTemplateProps) {
  return (
    <>
      <PageHeader title="Metas" subtitle="Tus objetivos de ahorro." action={<GoalModal mode="create" accounts={accounts} action={createAction} />} />

      <EmergencyFundCard emergencyFund={emergencyFund} />

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="Sin metas todavía" description="Crea tu primera meta de ahorro arriba." />
          </CardContent>
        </Card>
      ) : (
        <>
          <GoalRingsChart rings={goalRings(rows)} />
          <GoalsTable rows={rows} accounts={accounts} updateAction={updateAction} deleteAction={deleteAction} />
        </>
      )}
    </>
  );
}
