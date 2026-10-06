"use client";

import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";
import { EditAccountModal } from "@/components/molecules/EditAccountModal";
import type { AccountType } from "@/domain/accounts/rules";
import type { DebtTerms } from "@/domain/debts/rules";
import { ACCOUNT_TYPE_LABELS } from "@/lib/format";
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
  updateAccountAction: (formData: FormData) => Promise<void> | void;
  deleteAccountAction: (formData: FormData) => Promise<void> | void;
}

export function AccountsTable({ rows, updateAccountAction, deleteAccountAction }: AccountsTableProps) {

  const columns: DataTableColumn<AccountRow>[] = [
    { key: "name", header: "Cuenta", isRowHeader: true, cell: (a) => <span className="font-medium">{a.name}</span> },
    { key: "type", header: "Tipo", cell: (a) => <Text tone="muted">{ACCOUNT_TYPE_LABELS[a.type]}</Text> },
    {
      key: "balance",
      header: "Saldo",
      align: "right",
      cell: (a) => <CurrencyText cents={a.balanceCents} weight="medium" tone={a.balanceCents < 0 ? "danger" : "default"} />,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (a) => (
        <div className="flex items-center justify-end gap-1">
          <EditAccountModal accountId={a.id} name={a.name} type={a.type} creditLimitCents={a.creditLimitCents} debtTerms={a.debtTerms} updateAccountAction={updateAccountAction} />
          <ConfirmDeleteButton
            title="Eliminar cuenta"
            triggerAriaLabel={`Eliminar ${a.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{a.name}&rdquo;</span>?
              </>
            }
            helperText="Si ya tiene movimientos registrados, se archivará en vez de borrarse — tu historial no se pierde."
            hiddenFields={{ [FIELD.accountId]: a.id }}
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
