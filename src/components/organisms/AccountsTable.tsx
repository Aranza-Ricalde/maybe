"use client";

import type { FormAction } from "@/lib/actionResult";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { DeleteEntityButton } from "./DeleteEntityButton";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";
import { EditAccountModal } from "@/components/molecules/EditAccountModal";
import { creditUtilization, type AccountType } from "@/domain/accounts/rules";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DebtTerms } from "@/domain/debts/rules";
import { ACCOUNT_TYPE_LABELS, formatPercent, formatPesos } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

export interface AccountRow {
  id: number;
  name: string;
  type: AccountType;
  balanceCents: number;
  creditLimitCents: number | null;
  debtTerms: DebtTerms;
}

export interface AccountsTableProps {
  rows: AccountRow[];
  updateAccountAction: FormAction;
  deleteAccountAction: FormAction;
}

export function AccountsTable({ rows, updateAccountAction, deleteAccountAction }: AccountsTableProps) {

  const columns: DataTableColumn<AccountRow>[] = [
    { key: "name", header: "Cuenta", isRowHeader: true, cell: (a) => <span className="font-medium">{a.name}</span> },
    { key: "type", header: "Tipo", cell: (a) => <Badge variant="secondary">{ACCOUNT_TYPE_LABELS[a.type]}</Badge> },
    {
      key: "balance",
      header: "Saldo",
      align: "right",
      cell: (a) => {
        const usage = creditUtilization(a.balanceCents, a.creditLimitCents);
        return (
          <div className="flex flex-col items-end gap-1">
            <CurrencyText cents={a.balanceCents} weight="medium" tone={a.balanceCents < 0 ? "danger" : "default"} />
            {usage != null && (
              <div className="flex w-32 flex-col items-end gap-1">
                <Progress value={usage * 100} variant={usage >= 0.8 ? "destructive" : usage >= 0.5 ? "warning" : "default"} aria-label={`Uso del crédito de ${a.name}`} className="h-1" />
                <Text size="xs" tone="muted">
                  {formatPercent(usage)} de {formatPesos(a.creditLimitCents ?? 0)}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (a) => (
        <div className="flex items-center justify-end gap-1">
          <EditAccountModal accountId={a.id} name={a.name} type={a.type} creditLimitCents={a.creditLimitCents} debtTerms={a.debtTerms} updateAccountAction={updateAccountAction} />
          <DeleteEntityButton noun="cuenta" name={a.name} id={a.id} idField={FIELD.accountId}
            helperText="Si ya tiene movimientos registrados, se archivará en vez de borrarse — tu historial no se pierde."
            action={deleteAccountAction}
          />
        </div>
      ),
    },
  ];

  return (
    <ClientDataTable
      ariaLabel="Cuentas"
      columns={columns}
      rows={rows}
      getRowId={(a) => a.id}
      emptyTitle="Sin cuentas"
      emptyDescription="Agrega tu primera cuenta para empezar."
      itemsLabel="cuentas"
      minWidthClassName="min-w-[640px]"
    />
  );
}
