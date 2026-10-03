import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";

export interface TransferAccountOption {
  id: number;
  name: string;
}

export interface TransferModalProps {
  accounts: TransferAccountOption[];
  today: string;
  recordTransferAction: (formData: FormData) => Promise<void> | void;
}

const TRANSFER_KIND_OPTIONS = [
  { value: "transfer", label: "Transferencia entre cuentas" },
  { value: "cc_payment", label: "Pago de tarjeta de crédito" },
  { value: "loan_payment", label: "Pago de préstamo" },
];

export function TransferModal({ accounts, today, recordTransferAction }: TransferModalProps) {
  return (
    <FormModal title="Registrar transferencia" trigger="Transferencia" triggerVariant="ghost" submitLabel="Registrar" action={recordTransferAction}>
      <SelectField label="Tipo" name="kind" defaultValue="transfer" options={TRANSFER_KIND_OPTIONS} />
      <SelectField
        label="Cuenta origen"
        name="fromAccountId"
        defaultValue={accounts[0] ? String(accounts[0].id) : undefined}
        options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
      />
      <SelectField
        label="Cuenta destino"
        name="toAccountId"
        defaultValue={accounts[1] ? String(accounts[1].id) : undefined}
        options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
      />
      <TextInput label="Monto" name="amount" type="number" step="0.01" min="0.01" placeholder="500.00" isRequired />
      <TextInput label="Fecha" name="date" type="date" defaultValue={today} isRequired />
      <TextInput label="Notas (opcional)" name="notes" />
    </FormModal>
  );
}
