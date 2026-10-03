"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/atoms/Chip";
import { ConceptModal, type ConceptCategoryOption, type ConceptProviderOption } from "./ConceptModal";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "./DataTable";

export interface ConceptRow {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  providerId: number | null;
  providerName: string | null;
  flow: "income" | "expense";
}

export interface ConceptsTableProps {
  rows: ConceptRow[];
  categories: ConceptCategoryOption[];
  providers: ConceptProviderOption[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
}

const PAGE_SIZE = 10;

export function ConceptsTable({ rows, categories, providers, updateAction, deleteAction }: ConceptsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  const columns: DataTableColumn<ConceptRow>[] = [
    {
      key: "name",
      header: "Nombre",
      isRowHeader: true,
      cell: (c) => <span className="font-medium">{c.name}</span>,
    },
    { key: "category", header: "Categoría", cell: (c) => c.categoryName },
    { key: "provider", header: "Proveedor", cell: (c) => c.providerName ?? "—" },
    {
      key: "flow",
      header: "Tipo",
      cell: (c) => <Chip tone={c.flow === "income" ? "success" : "muted"}>{c.flow === "income" ? "Ingreso" : "Gasto"}</Chip>,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <ConceptModal
            mode="edit"
            action={updateAction}
            categories={categories}
            providers={providers}
            initialValues={{ id: c.id, name: c.name, categoryId: c.categoryId, providerId: c.providerId, flow: c.flow }}
          />
          <ConfirmDeleteButton
            title="Eliminar concepto"
            triggerAriaLabel={`Eliminar ${c.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{c.name}&rdquo;</span>?
              </>
            }
            helperText="Los movimientos y recurrentes que lo usaban se quedan sin concepto — no se pierde ningún movimiento."
            hiddenFields={{ id: c.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Conceptos"
      columns={columns}
      rows={pageRows}
      getRowId={(c) => c.id}
      totalItems={rows.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptyTitle="Sin conceptos todavía"
      emptyDescription="Un concepto agrupa categoría + proveedor (ej. 'Internet Casa' = Servicios + Telmex)."
      itemsLabel="conceptos"
      minWidthClassName="min-w-[520px]"
      wrapInCard={false}
    />
  );
}
