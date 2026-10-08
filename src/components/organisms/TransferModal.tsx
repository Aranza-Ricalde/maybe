import type { FormAction } from "@/lib/actionResult";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";
import { FIELD } from "@/lib/formFields";
import type { AccountOption } from "@/components/viewModels";

export interface TransferModalProps {
  accounts: AccountOption[];
  today: string;
  recordTransferAction: FormAction;
}

const TRANSFER_KIND_OPTIONS = [
  { value: "transfer", label: "Transferencia entre cuentas" },
  { value: "cc_payment", label: "Pago de tarjeta de crédito" },
  { value: "loan_payment", label: "Pago de préstamo" },
];

export function TransferModal({ accounts, today, recordTransferAction }: TransferModalProps) {
  return (
    <FormModal title="Registrar transferencia" trigger="Transferencia" triggerVariant="ghost" submitLabel="Registrar" action={recordTransferAction}>
      <SelectField label="Tipo" name={FIELD.kind} defaultValue="transfer" options={TRANSFER_KIND_OPTIONS} />
      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <SelectField
          label="Cuenta origen"
          name={FIELD.fromAccountId}
          defaultValue={accounts[0] ? String(accounts[0].id) : undefined}
          options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
        />
        <SelectField
          label="Cuenta destino"
          name={FIELD.toAccountId}
          defaultValue={accounts[1] ? String(accounts[1].id) : undefined}
          options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <TextInput label="Monto" prefix="$" name={FIELD.amount} type="number" step="0.01" min="0.01" placeholder="500.00" isRequired />
        <TextInput label="Fecha" name={FIELD.date} type="date" defaultValue={today} isRequired />
      </div>
      <TextInput label="Notas" description="Opcional." name={FIELD.notes} />
    </FormModal>
  );
}
