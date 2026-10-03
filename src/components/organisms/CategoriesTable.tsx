"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/atoms/Chip";
import { CategoryModal } from "./CategoryModal";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "./DataTable";

export interface CategoryRow {
  id: number;
  name: string;
  color: string;
  classification: "income" | "expense";
}

export interface CategoriesTableProps {
  rows: CategoryRow[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
}

const PAGE_SIZE = 10;

export function CategoriesTable({ rows, updateAction, deleteAction }: CategoriesTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  const columns: DataTableColumn<CategoryRow>[] = [
    {
      key: "name",
      header: "Nombre",
      isRowHeader: true,
      cell: (c) => (
        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
          <span className="font-medium">{c.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (c) => <Chip tone={c.classification === "income" ? "success" : "muted"}>{c.classification === "income" ? "Ingreso" : "Gasto"}</Chip>,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <CategoryModal mode="edit" action={updateAction} initialValues={{ id: c.id, name: c.name, classification: c.classification, color: c.color }} />
          <ConfirmDeleteButton
            title="Eliminar categoría"
            triggerAriaLabel={`Eliminar ${c.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{c.name}&rdquo;</span>?
              </>
            }
            helperText="Los movimientos, recurrentes o presupuestos que la usaban se quedan sin categoría — no se pierde ningún movimiento."
            hiddenFields={{ id: c.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Categorías"
      columns={columns}
      rows={pageRows}
      getRowId={(c) => c.id}
      totalItems={rows.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptyTitle="Sin categorías todavía"
      emptyDescription="Crea tu primera categoría arriba."
      itemsLabel="categorías"
      minWidthClassName="min-w-[420px]"
      wrapInCard={false}
    />
  );
}
