"use client";

import { Text } from "@/components/atoms/Text";
import { ChoiceCards } from "@/components/molecules/ChoiceCards";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { PaydayList } from "@/components/molecules/PaydayList";
import type { AccountOption } from "@/components/viewModels";
import type { PeriodRange } from "@/domain/payPeriod/rules";
import type { PayrollSetup } from "@/domain/recurring/payroll";
import { usePayrollForm } from "@/hooks/usePayrollForm";
import { FIELD } from "@/lib/formFields";

export interface PayrollFormFieldsProps {
  setup: PayrollSetup | null;
  periods: PeriodRange[];
  suggestedMonthlyDay: number | null;
  categoryId: number | null;
  accounts: AccountOption[];
  today: string;
}

const FREQUENCY_CHOICES = [
  { value: "biweekly" as const, title: "Quincenal", description: "2 pagos al mes" },
  { value: "monthly" as const, title: "Mensual", description: "1 pago al mes" },
];
const DAY_CHOICES = [
  { value: "sync" as const, title: "Inicio de cada periodo", description: "Como tus periodos de pago" },
  { value: "manual" as const, title: "Otros días", description: "Tú eliges los días" },
];
const NO_ACCOUNT = "";

export function PayrollFormFields({ setup, periods, suggestedMonthlyDay, categoryId, accounts, today }: PayrollFormFieldsProps) {
  const form = usePayrollForm({ setup, periods, suggestedMonthlyDay, today });

  return (
    <>
      <input type="hidden" name={FIELD.payrollFrequency} value={form.frequency} />
      <input type="hidden" name={FIELD.payrollMode} value={form.mode} />
      {categoryId != null && <input type="hidden" name={FIELD.categoryId} value={categoryId} />}

      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <TextInput label="Cuánto te pagan cada vez" prefix="$" name={FIELD.estimatedAmount} type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={form.setAmount} isRequired />
        <SelectField
          label="Cuenta donde te depositan"
          name={FIELD.accountId}
          defaultValue={setup?.accountId != null ? String(setup.accountId) : NO_ACCOUNT}
          options={[{ value: NO_ACCOUNT, label: "Sin cuenta específica" }, ...accounts.map((account) => ({ value: String(account.id), label: account.name }))]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Text weight="medium">¿Cada cuánto te pagan?</Text>
        <ChoiceCards label="Frecuencia de pago" options={FREQUENCY_CHOICES} value={form.frequency} onChange={form.setFrequency} />
      </div>

      <div className="flex flex-col gap-2">
        <Text weight="medium">{form.paydayCount === 2 ? "¿Qué días cobras?" : "¿Qué día cobras?"}</Text>
        {form.syncAvailable && <ChoiceCards label="Días de cobro" options={DAY_CHOICES} value={form.mode} onChange={(mode) => form.setSync(mode === "sync")} />}
        {form.mode === "manual" && (
          <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            <TextInput label={form.paydayCount === 2 ? "Primer día de cobro" : "Día de cobro"} name={FIELD.payrollFirstDay} type="number" min="1" max="31" placeholder="1 a 31" value={form.manualDays[0]} onChange={(value) => form.setManualDay(0, value)} isRequired />
            {form.paydayCount === 2 && <TextInput label="Segundo día de cobro" name={FIELD.payrollSecondDay} type="number" min="1" max="31" placeholder="1 a 31" value={form.manualDays[1]} onChange={(value) => form.setManualDay(1, value)} isRequired />}
          </div>
        )}
        {form.mode === "sync" && (
          <Text size="xs" tone="muted">
            Cobras el primer día de cada periodo de pago de Configuración; si los cambias, las fechas se ajustan solas.
          </Text>
        )}
        {form.frequency === "monthly" && (
          <Text size="xs" tone="muted">
            Para pago mensual elige el día del mes; te sugerimos el inicio de tu mes de pago actual.
          </Text>
        )}
      </div>

      <PaydayList dates={form.previewDates} />
    </>
  );
}
