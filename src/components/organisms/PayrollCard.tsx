"use client";

import { Banknote } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import type { AccountOption } from "@/components/viewModels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PeriodRange } from "@/domain/payPeriod/rules";
import { PAYROLL_FREQUENCY_LABELS, type PayrollSetup } from "@/domain/recurring/payroll";
import type { FormAction } from "@/lib/actionResult";
import { formatCurrency } from "@/lib/format";
import { describePaydays } from "@/lib/presenters/payroll";
import { FormModal } from "./FormModal";
import { PayrollFormFields } from "./PayrollFormFields";

export interface PayrollCardProps {
  setup: PayrollSetup | null;
  periods: PeriodRange[];
  suggestedMonthlyDay: number | null;
  categoryId: number | null;
  accounts: AccountOption[];
  today: string;
  action: FormAction;
}

function scheduleLabel(setup: PayrollSetup): string {
  if (setup.mode === "sync") return "al inicio de cada periodo";
  return `cobras ${describePaydays(setup.days)}`;
}

export function PayrollCard({ setup, periods, suggestedMonthlyDay, categoryId, accounts, today, action }: PayrollCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Banknote className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2 text-sm font-medium">
              Nómina
              {setup && <Badge variant="success">Configurada</Badge>}
            </span>
            <Text size="sm" tone="muted">
              {setup ? `${formatCurrency(setup.amountCents)} por pago · ${PAYROLL_FREQUENCY_LABELS[setup.frequency].toLowerCase()} · ${scheduleLabel(setup)}` : "Dinos cuánto te pagan y cada cuánto, y lo contamos como ingreso fijo."}
            </Text>
          </div>
        </div>

        <FormModal
          title="Tu nómina"
          trigger={setup ? "Editar nómina" : "Configurar nómina"}
          triggerVariant={setup ? "outline" : "default"}
          submitLabel={setup ? "Actualizar nómina" : "Guardar nómina"}
          size="md"
          action={action}
        >
          <PayrollFormFields setup={setup} periods={periods} suggestedMonthlyDay={suggestedMonthlyDay} categoryId={categoryId} accounts={accounts} today={today} />
        </FormModal>
      </CardContent>
    </Card>
  );
}
