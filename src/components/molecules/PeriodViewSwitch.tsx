"use client";

import { useTransition } from "react";
import { Text } from "@/components/atoms/Text";
import { ACTIVE_ACCENT, SegmentedButtons } from "@/components/molecules/SegmentedButtons";
import { PERIOD_VIEWS, PERIOD_VIEW_LABELS, type PeriodView } from "@/domain/payPeriod/periodView";

export interface PeriodViewSwitchProps {
  value: PeriodView;
  action: (formData: FormData) => Promise<void> | void;
}

export function PeriodViewSwitch({ value, action }: PeriodViewSwitchProps) {
  const [isPending, startTransition] = useTransition();

  function choose(view: PeriodView) {
    if (view === value) return;
    const formData = new FormData();
    formData.set("view", view);
    startTransition(() => {
      void action(formData);
    });
  }

  return (
    <div className="flex flex-col gap-2" aria-busy={isPending}>
      <SegmentedButtons options={PERIOD_VIEWS.map((view) => ({ value: view, label: PERIOD_VIEW_LABELS[view] }))} value={value} onChange={choose} activeClassName={ACTIVE_ACCENT} />
      <Text size="sm" tone="muted">
        {value === "monthly"
          ? "Verás el mes de pago completo (tus dos quincenas juntas). Un presupuesto mensual cuenta exacto."
          : "Verás una quincena a la vez y podrás combinar varias. Un presupuesto mensual cuenta la mitad en cada quincena."}
      </Text>
    </div>
  );
}
