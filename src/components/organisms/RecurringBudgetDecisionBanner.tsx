"use client";

import { ActionForm } from "@/components/molecules/ActionForm";
import type { FormAction } from "@/lib/actionResult";
import { CircleQuestionMark } from "lucide-react";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import { formatPesos } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { ReviewQueueBanner } from "./ReviewQueueBanner";

export interface BudgetDecisionItem {
  id: number;
  name: string;
  amountCents: number;
  categoryName: string;
}

export interface RecurringBudgetDecisionBannerProps {
  pending: BudgetDecisionItem[];
  action: FormAction;
}

export function RecurringBudgetDecisionBanner({ pending, action }: RecurringBudgetDecisionBannerProps) {
  return (
    <ReviewQueueBanner
      items={pending}
      ariaLabel="Recurrentes por decidir"
      icon={CircleQuestionMark}
      getKey={(item) => item.id}
      renderActions={(item) => (
        <ActionForm action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name={FIELD.recurringItemId} value={item.id} />
          <PendingSubmitButton name={FIELD.decision} value="include">
            Sí, usarlo
          </PendingSubmitButton>
          <PendingSubmitButton name={FIELD.decision} value="exclude" variant="ghost">
            No usarlo
          </PendingSubmitButton>
        </ActionForm>
      )}
      renderDetails={(item) => (
        <>
          <p>
            Si lo usas, {formatPesos(Math.abs(item.amountCents))} al mes sirven de presupuesto de {item.categoryName} mientras no definas uno manual (el que tú pongas siempre manda); si no, lo sigues viendo como recurrente pero no aparta dinero. Mientras no decidas, se usa como siempre.
          </p>
          <ActionForm action={action} className="flex flex-wrap items-center gap-2 pt-1">
            <input type="hidden" name={FIELD.recurringItemId} value={item.id} />
            <input type="hidden" name={FIELD.rememberForAll} value="on" />
            <span>Para este, los demás y los recurrentes nuevos:</span>
            <PendingSubmitButton name={FIELD.decision} value="include" variant="ghost">
              Usarlos todos, no volver a preguntar
            </PendingSubmitButton>
            <PendingSubmitButton name={FIELD.decision} value="exclude" variant="ghost">
              No usar ninguno, no volver a preguntar
            </PendingSubmitButton>
          </ActionForm>
        </>
      )}
      renderHeadline={(item, total) => (
        <>
          <p className="text-sm leading-snug">
            ¿<span className="font-semibold">{item.name}</span>{" "}
            <span className="text-muted-foreground">
              ({formatPesos(Math.abs(item.amountCents))} · {item.categoryName})
            </span>{" "}
            sirve de presupuesto de su categoría?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Recurrente {total > 1 ? `· quedan ${total - 1} más por decidir` : "· el último por decidir"}</p>
        </>
      )}
    />
  );
}
