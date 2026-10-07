"use client";

import { CircleQuestion } from "@gravity-ui/icons";
import { useState } from "react";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import { formatPesos } from "@/lib/format";
import { ReviewAlert } from "./ReviewAlert";
import { FIELD } from "@/lib/formFields";

export interface BudgetDecisionItem {
  id: number;
  name: string;
  amountCents: number;
  categoryName: string;
}

export interface RecurringBudgetDecisionBannerProps {
  pending: BudgetDecisionItem[];
  action: (formData: FormData) => void;
}

export function RecurringBudgetDecisionBanner({ pending, action }: RecurringBudgetDecisionBannerProps) {
  const [index, setIndex] = useState(0);
  if (pending.length === 0) return null;

  const current = Math.min(index, pending.length - 1);
  const item = pending[current];
  const go = (delta: number) => setIndex((current + delta + pending.length) % pending.length);

  return (
    <ReviewAlert
      ariaLabel="Recurrentes por decidir"
      icon={CircleQuestion}
      itemKey={item.id}
      position={{ current, total: pending.length, onGo: go }}
      actions={
        <form key={item.id} action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name={FIELD.recurringItemId} value={item.id} />
          <PendingSubmitButton name={FIELD.decision} value="include">
            Sí, usarlo
          </PendingSubmitButton>
          <PendingSubmitButton name={FIELD.decision} value="exclude" variant="ghost">
            No usarlo
          </PendingSubmitButton>
        </form>
      }
      details={
        <>
          <p>
            Si lo usas, {formatPesos(Math.abs(item.amountCents))} al mes sirven de presupuesto de {item.categoryName} mientras no definas uno manual (el que tú pongas siempre manda); si no, lo sigues viendo como recurrente pero no aparta dinero. Mientras no decidas, se usa como siempre.
          </p>
          <form action={action} className="flex flex-wrap items-center gap-2 pt-1">
            <input type="hidden" name={FIELD.recurringItemId} value={item.id} />
            <input type="hidden" name={FIELD.rememberForAll} value="on" />
            <span>Para este, los demás y los recurrentes nuevos:</span>
            <PendingSubmitButton name={FIELD.decision} value="include" variant="ghost">
              Usarlos todos, no volver a preguntar
            </PendingSubmitButton>
            <PendingSubmitButton name={FIELD.decision} value="exclude" variant="ghost">
              No usar ninguno, no volver a preguntar
            </PendingSubmitButton>
          </form>
        </>
      }
    >
      <p className="text-sm leading-snug">
        ¿<span className="font-semibold">{item.name}</span>{" "}
        <span className="text-muted">
          ({formatPesos(Math.abs(item.amountCents))} · {item.categoryName})
        </span>{" "}
        sirve de presupuesto de su categoría?
      </p>
      <p className="mt-0.5 text-xs text-muted">Recurrente {pending.length > 1 ? `· quedan ${pending.length - 1} más por decidir` : "· el último por decidir"}</p>
    </ReviewAlert>
  );
}
