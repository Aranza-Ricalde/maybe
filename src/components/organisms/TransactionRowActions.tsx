import type { FormAction } from "@/lib/actionResult";
import { ActionForm } from "@/components/molecules/ActionForm";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/atoms/Icon";
import type { AccountOption, CategoryOption, TransactionRowView } from "@/components/viewModels";
import { formatCurrency, formatDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { DeleteEntityButton } from "./DeleteEntityButton";
import { EditTransactionModal } from "./EditTransactionModal";
import { MarkTransferModal } from "./MarkTransferModal";


export interface TransactionRowActionsProps {
  row: TransactionRowView;
  accounts: AccountOption[];
  categories: CategoryOption[];
  onUpdate: FormAction;
  onDelete: FormAction;
  onUndoTransfer?: FormAction;
  onMarkTransfer?: FormAction;
}

const CONFIRMED_TRANSFER = "confirmed_transfer";

export function TransactionRowActions({ row, accounts, categories, onUpdate, onDelete, onUndoTransfer, onMarkTransfer }: TransactionRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onUndoTransfer && row.reviewDecision === CONFIRMED_TRANSFER && (
        <ActionForm action={onUndoTransfer}>
          <input type="hidden" name={FIELD.transactionId} value={row.id} />
          <Button type="submit" variant="ghost" size="icon-sm" title="Deshacer: volver a contarlo como gasto o ingreso" aria-label={`Deshacer transferencia ${row.name}`}>
            <Icon icon={RotateCcw} />
          </Button>
        </ActionForm>
      )}
      {onMarkTransfer && row.kind === "standard" && (
        <MarkTransferModal transactionId={row.id} name={row.name} detail={`${row.accountName} · ${formatDate(row.date)} · ${formatCurrency(row.amountCents)}`} action={onMarkTransfer} />
      )}
      <EditTransactionModal
        accounts={accounts}
        categories={categories}
        action={onUpdate}
        initialValues={{ id: row.id, accountId: row.accountId, categoryId: row.categoryId, name: row.name, amountCents: row.amountCents, date: row.date }}
      />
      <DeleteEntityButton noun="movimiento" name={row.name} id={row.id}
        helperText="Tu saldo y tus totales de categoría se ajustan solos para que todo siga cuadrando."
        action={onDelete}
      />
    </div>
  );
}
