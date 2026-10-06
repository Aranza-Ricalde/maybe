import { ArrowRotateLeft } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import type { AccountOption, CategoryOption, TransactionRowView } from "@/components/viewModels";
import { formatCurrency, formatDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { EditTransactionModal } from "./EditTransactionModal";
import { MarkTransferModal } from "./MarkTransferModal";

type FormAction = (formData: FormData) => Promise<void> | void;

export interface TransactionRowActionsProps {
  row: TransactionRowView;
  accounts: AccountOption[];
  categories: CategoryOption[];
  onUpdate: FormAction;
  onDelete: FormAction;
  onUndoTransfer?: FormAction;
  onMarkTransfer?: FormAction;
}

const UNDO_BUTTON_CLASSNAME = "inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";
const CONFIRMED_TRANSFER = "confirmed_transfer";

export function TransactionRowActions({ row, accounts, categories, onUpdate, onDelete, onUndoTransfer, onMarkTransfer }: TransactionRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onUndoTransfer && row.reviewDecision === CONFIRMED_TRANSFER && (
        <form action={onUndoTransfer}>
          <input type="hidden" name={FIELD.transactionId} value={row.id} />
          <button type="submit" title="Deshacer: volver a contarlo como gasto o ingreso" aria-label={`Deshacer transferencia ${row.name}`} className={UNDO_BUTTON_CLASSNAME}>
            <Icon icon={ArrowRotateLeft} />
          </button>
        </form>
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
      <ConfirmDeleteButton
        title="Eliminar movimiento"
        triggerAriaLabel={`Eliminar ${row.name}`}
        confirmQuestion={
          <>
            ¿Eliminar <span className="font-semibold">&ldquo;{row.name}&rdquo;</span>?
          </>
        }
        helperText="Tu saldo y tus totales de categoría se ajustan solos para que todo siga cuadrando."
        hiddenFields={{ [FIELD.id]: row.id }}
        action={onDelete}
      />
    </div>
  );
}
