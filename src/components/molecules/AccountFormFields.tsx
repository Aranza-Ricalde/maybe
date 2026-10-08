import { SelectField, TextInput } from "@/components/molecules/FormField";
import type { AccountType } from "@/domain/accounts/rules";
import type { DebtTerms } from "@/domain/debts/rules";
import { ACCOUNT_TYPE_OPTIONS, centsToInputValue } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

export interface AccountFormDefaults {
  name: string;
  type: AccountType;
  creditLimitCents: number | null;
}

export interface AccountFormFieldsProps {
  defaults?: AccountFormDefaults;
  debtTerms?: DebtTerms;
}

const DEFAULT_ACCOUNT_TYPE: AccountType = "checking";

export function AccountFormFields({ defaults, debtTerms }: AccountFormFieldsProps) {
  return (
    <>
      <TextInput label="Nombre" name={FIELD.name} defaultValue={defaults?.name} isRequired />
      <SelectField label="Tipo" name={FIELD.type} defaultValue={defaults?.type ?? DEFAULT_ACCOUNT_TYPE} options={ACCOUNT_TYPE_OPTIONS} />
      <TextInput label="Límite de crédito" description="Solo para tarjetas de crédito. Opcional." prefix="$" name={FIELD.creditLimitCents} type="number" step="0.01" min="0" defaultValue={centsToInputValue(defaults?.creditLimitCents)} />
      {debtTerms && (
        <>
          <TextInput label="Tasa de interés anual" description="En porcentaje. Opcional." prefix="%" name={FIELD.annualRatePct} type="number" step="0.01" min="0" defaultValue={debtTerms.annualRatePct?.toString()} />
          <TextInput label="Pago mínimo al mes" description="Opcional." prefix="$" name={FIELD.minimumPayment} type="number" step="0.01" min="0" defaultValue={centsToInputValue(debtTerms.minimumPaymentCents)} />
          <TextInput label="Día de vencimiento del pago" description="Día del mes, del 1 al 31. Opcional." name={FIELD.paymentDueDay} type="number" step="1" min="1" max="31" defaultValue={debtTerms.paymentDueDay?.toString()} />
        </>
      )}
    </>
  );
}
