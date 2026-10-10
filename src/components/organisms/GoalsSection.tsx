import type { FormAction } from "@/lib/actionResult";
import type { EmergencyFundView } from "@/application/getEmergencyFund";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountOption } from "@/components/viewModels";
import { EmergencyFundCard } from "./EmergencyFundCard";
import { GoalModal } from "./GoalModal";
import { GoalsList } from "./GoalsList";
import { GoalsTable, type GoalRow } from "./GoalsTable";

export interface GoalsSectionProps {
  rows: GoalRow[];
  accounts: AccountOption[];
  emergencyFund: EmergencyFundView;
  createAction: FormAction;
  updateAction: FormAction;
  deleteAction: FormAction;
}

export function GoalsSection({ rows, accounts, emergencyFund, createAction, updateAction, deleteAction }: GoalsSectionProps) {
  return (
    <section aria-label="Metas de ahorro" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Metas de ahorro</h2>
          <p className="text-sm text-muted-foreground">Tus objetivos y cuánto falta para llegar.</p>
        </div>
        <GoalModal mode="create" accounts={accounts} action={createAction} />
      </div>

      <EmergencyFundCard emergencyFund={emergencyFund} />

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="Sin metas todavía" description="Crea tu primera meta de ahorro con el botón de arriba." />
          </CardContent>
        </Card>
      ) : (
        <>
          <GoalsTable rows={rows} accounts={accounts} updateAction={updateAction} deleteAction={deleteAction} />
          <Card className="md:hidden">
            <CardHeader>
              <CardTitle>Tus metas</CardTitle>
              <CardDescription>Toca una meta para ver el detalle o editarla.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoalsList rows={rows} accounts={accounts} updateAction={updateAction} deleteAction={deleteAction} />
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
