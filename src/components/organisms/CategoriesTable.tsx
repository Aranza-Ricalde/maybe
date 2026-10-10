"use client";

import type { FormAction } from "@/lib/actionResult";
import { expensesFirst, parentOptionsFor } from "@/lib/presenters/categories";
import { Badge } from "@/components/ui/badge";
import { SPENDING_NATURE_LABELS, type SpendingNature } from "@/domain/categories/nature";
import { CategoryModal } from "./CategoryModal";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { DeleteEntityButton } from "./DeleteEntityButton";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";
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
  description: string | null;
  descriptionText: string | null;
  descriptionIsSuggested: boolean;
}

export interface CategoriesTableProps {
  rows: CategoryRow[];
  updateAction: FormAction;
  deleteAction: FormAction;
}

export function CategoriesTable({ rows, updateAction, deleteAction }: CategoriesTableProps) {
  const columns: DataTableColumn<CategoryRow>[] = [
    {
      key: "name",
      header: "Nombre",
      isRowHeader: true,
      cell: (c) => (
        <div className="flex items-center gap-1">
          <CategoryNameCell name={c.name} color={c.color} depth={c.depth} />
          <InfoTooltip label={c.descriptionText ?? "Sin descripción. Edita la categoría para agregar una."} ariaLabel={`¿Qué va en ${c.name}?`} />
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (c) => <Badge variant={c.classification === "income" ? "success" : "secondary"}>{c.classification === "income" ? "Ingreso" : "Gasto"}</Badge>,
    },
    {
      key: "nature",
      header: "Naturaleza",
      mobileRole: "subtitle",
      cell: (c) =>
        c.classification === "expense" && c.nature ? (
          <Badge variant={c.nature === "essential" ? "success" : c.nature === "savings" ? "outline" : "secondary"}>{SPENDING_NATURE_LABELS[c.nature]}</Badge>
        ) : (
          null
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
            initialValues={{ id: c.id, name: c.name, classification: c.classification, color: c.color, parentId: c.parentId, nature: c.nature, description: c.description }}
            parentOptions={parentOptionsFor(rows, c.id, c.hasChildren)}
          />
          <DeleteEntityButton noun="categoría" name={c.name} id={c.id}
            helperText="Los movimientos, recurrentes o presupuestos que la usaban se quedan sin categoría — no se pierde ningún movimiento."
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
      rows={expensesFirst(rows)}
      getRowId={(c) => c.id}
      emptyTitle="Sin categorías todavía"
      emptyDescription="Crea tu primera categoría arriba."
      itemsLabel="categorías"
      minWidthClassName="min-w-[520px]"
      wrapInCard={false}
      mobile={{ compact: true, loadMoreStep: 10, group: { getKey: (c) => c.classification, getLabel: (key) => (key === "income" ? "Ingresos" : "Gastos"), hiddenColumnKeys: ["type"] } }}
    />
  );
}
