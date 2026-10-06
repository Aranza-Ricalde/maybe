import { TransactionFormFields } from "@/components/molecules/TransactionFormFields";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { FormModal } from "./FormModal";

export interface CreateTransactionModalProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
  today: string;
  createTransactionAction: (formData: FormData) => Promise<void> | void;
}

export function CreateTransactionModal({ accounts, categories, today, createTransactionAction }: CreateTransactionModalProps) {
  return (
    <FormModal title="Registrar movimiento" trigger="+ Registrar movimiento" submitLabel="Registrar" action={createTransactionAction}>
      <TransactionFormFields accounts={accounts} categories={categories} defaults={{ date: today }} amountPlaceholder="-150.00" />
    </FormModal>
  );
}
