import type { FormAction } from "@/lib/actionResult";
import { TransactionFormFields } from "@/components/molecules/TransactionFormFields";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { FormModal } from "./FormModal";

export interface CreateTransactionModalProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
  today: string;
  createTransactionAction: FormAction;
  defaultOpen?: boolean;
}

export function CreateTransactionModal({ accounts, categories, today, createTransactionAction, defaultOpen }: CreateTransactionModalProps) {
  return (
    <FormModal title="Registrar movimiento" trigger="+ Registrar movimiento" submitLabel="Registrar" defaultOpen={defaultOpen} action={createTransactionAction}>
      <TransactionFormFields accounts={accounts} categories={categories} defaults={{ date: today }} />
    </FormModal>
  );
}
