"use client";

import { useMemo } from "react";
import { Chip } from "@/components/atoms/Chip";
import { SPENDING_NATURE_LABELS, type SpendingNature } from "@/domain/categories/nature";
import { CategoryModal } from "./CategoryModal";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";
import { FIELD } from "@/lib/formFields";
import { CategoryNameCell } from "@/components/molecules/CategoryNameCell";

export interface CategoryRow {
  id: number;
  name: string;
  color: string;
  classification: "income" | "expense";
  parentId: number | null;
  nature: SpendingNature | null;
  depth: 0 | 1;
  hasChildren: boolean;
}

export interface CategoriesTableProps {
  rows: CategoryRow[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
}

export function CategoriesTable({ rows, updateAction, deleteAction }: CategoriesTableProps) {
  const topLevel = useMemo(() => rows.filter((r) => r.depth === 0), [rows]);

  const columns: DataTableColumn<CategoryRow>[] = [
    {
      key: "name",
      header: "Nombre",
      isRowHeader: true,
      cell: (c) => <CategoryNameCell name={c.name} color={c.color} depth={c.depth} />,
    },
    {
      key: "type",
      header: "Tipo",
      cell: (c) => <Chip tone={c.classification === "income" ? "success" : "muted"}>{c.classification === "income" ? "Ingreso" : "Gasto"}</Chip>,
    },
    {
      key: "nature",
      header: "Naturaleza",
      cell: (c) =>
        c.classification === "expense" && c.nature ? (
          <Chip tone={c.nature === "essential" ? "success" : "muted"}>{SPENDING_NATURE_LABELS[c.nature]}</Chip>
        ) : (
          <span className="text-xs text-muted">{c.classification === "expense" ? "—" : ""}</span>
        ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <CategoryModal
            mode="edit"
            action={updateAction}
            initialValues={{ id: c.id, name: c.name, classification: c.classification, color: c.color, parentId: c.parentId, nature: c.nature }}
            parentOptions={c.hasChildren ? [] : topLevel.filter((p) => p.id !== c.id).map((p) => ({ value: String(p.id), label: p.name }))}
          />
          <ConfirmDeleteButton
            title="Eliminar categoría"
            triggerAriaLabel={`Eliminar ${c.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{c.name}&rdquo;</span>?
              </>
            }
            helperText="Los movimientos, recurrentes o presupuestos que la usaban se quedan sin categoría — no se pierde ningún movimiento."
            hiddenFields={{ [FIELD.id]: c.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <ClientDataTable
      ariaLabel="Categorías"
      columns={columns}
      rows={rows}
      getRowId={(c) => c.id}
      emptyTitle="Sin categorías todavía"
      emptyDescription="Crea tu primera categoría arriba."
      itemsLabel="categorías"
      minWidthClassName="min-w-[520px]"
      wrapInCard={false}
    />
  );
}
