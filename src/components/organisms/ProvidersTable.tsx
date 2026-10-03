"use client";

import { useMemo, useState } from "react";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "./DataTable";
import { ProviderModal } from "./ProviderModal";

export interface ProviderRow {
  id: number;
  name: string;
}

export interface ProvidersTableProps {
  rows: ProviderRow[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
}

const PAGE_SIZE = 10;

export function ProvidersTable({ rows, updateAction, deleteAction }: ProvidersTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  const columns: DataTableColumn<ProviderRow>[] = [
    {
      key: "name",
      header: "Nombre",
      isRowHeader: true,
      cell: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <ProviderModal mode="edit" action={updateAction} initialValues={{ id: p.id, name: p.name }} />
          <ConfirmDeleteButton
            title="Eliminar proveedor"
            triggerAriaLabel={`Eliminar ${p.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{p.name}&rdquo;</span>?
              </>
            }
            helperText="Los conceptos y patrones de comercio que lo usaban se quedan sin proveedor — no se pierde ningún movimiento."
            hiddenFields={{ id: p.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Proveedores"
      columns={columns}
      rows={pageRows}
      getRowId={(p) => p.id}
      totalItems={rows.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptyTitle="Sin proveedores todavía"
      emptyDescription="Los proveedores se crean automáticamente al registrar movimientos, o puedes crearlos aquí."
      itemsLabel="proveedores"
      minWidthClassName="min-w-[320px]"
      wrapInCard={false}
    />
  );
}
