"use client";

import { useMemo, useState } from "react";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "./DataTable";
import { EditAccountModal } from "@/components/molecules/EditAccountModal";
import type { AccountType } from "@/domain/accounts/rules";
import { ACCOUNT_TYPE_LABELS } from "@/lib/format";

export interface AccountRow {
  id: number;
  name: string;
  type: AccountType;
  balanceCents: number;
  creditLimitCents: number | null;
}

export interface AccountsTableProps {
  rows: AccountRow[];
  updateAccountAction: (formData: FormData) => Promise<void> | void;
  deleteAccountAction: (formData: FormData) => Promise<void> | void;
}

export function AccountsTable({ rows, updateAccountAction, deleteAccountAction }: AccountsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

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
          <EditAccountModal accountId={a.id} name={a.name} type={a.type} creditLimitCents={a.creditLimitCents} updateAccountAction={updateAccountAction} />
          <ConfirmDeleteButton
            title="Eliminar cuenta"
            triggerAriaLabel={`Eliminar ${a.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{a.name}&rdquo;</span>?
              </>
            }
            helperText="Si ya tiene movimientos registrados, se archivará en vez de borrarse — tu historial no se pierde."
            hiddenFields={{ accountId: a.id }}
            action={deleteAccountAction}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Cuentas"
      columns={columns}
      rows={pageRows}
      getRowId={(a) => a.id}
      totalItems={rows.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptyTitle="Sin cuentas"
      emptyDescription="Agrega tu primera cuenta para empezar."
      itemsLabel="cuentas"
      minWidthClassName="min-w-[640px]"
    />
  );
}
