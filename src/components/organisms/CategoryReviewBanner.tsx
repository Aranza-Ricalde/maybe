"use client";

import { Tags } from "lucide-react";
import { ActionForm } from "@/components/molecules/ActionForm";
import { SignedAmountText } from "@/components/atoms/SignedAmountText";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import type { CategoryOption } from "@/components/viewModels";
import type { CategoryReviewGroup } from "@/domain/categories/reviewQueue";
import type { Flow } from "@/domain/ledger/rules";
import { TRANSFER_KIND_LABELS } from "@/domain/transfers/rules";
import type { FormAction } from "@/lib/actionResult";
import { formatPesos, formatShortDate } from "@/lib/format";
import { TRANSFER_CHOICES, categoryChoice, kindChoice } from "@/lib/presenters/reviewChoices";
import { FIELD } from "@/lib/formFields";
import { ReviewQueueBanner } from "./ReviewQueueBanner";

export type ReviewCategoryOption = CategoryOption & { classification: Flow };

export interface CategoryReviewBannerProps {
  groups: CategoryReviewGroup[];
  categories: ReviewCategoryOption[];
  categorizeAction: FormAction;
}

export function CategoryReviewBanner({ groups, categories, categorizeAction }: CategoryReviewBannerProps) {
  return (
    <ReviewQueueBanner
      items={groups}
      ariaLabel="Movimientos por categorizar"
      icon={Tags}
      getKey={(group) => `${group.providerId}:${group.flow}:${group.hintKey}`}
      renderActions={(group) => (
        <ActionForm action={categorizeAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name={FIELD.providerId} value={group.providerId} />
          <input type="hidden" name={FIELD.flow} value={group.flow} />
          <input type="hidden" name={FIELD.hintKey} value={group.hintKey} />
          <NativeSelect
            size="sm"
            name={FIELD.choice}
            required
            defaultValue={group.hint?.kind ? kindChoice(group.hint.kind) : ""}
            aria-label={`Qué es ${group.providerName}`}
            className="max-w-64"
          >
            <NativeSelectOption value="" disabled>
              {group.flow === "income" ? "¿Qué ingreso es?" : "¿Qué gasto es?"}
            </NativeSelectOption>
            <NativeSelectOptGroup label="No cuenta como gasto ni ingreso">
              {TRANSFER_CHOICES[group.flow].map((kind) => (
                <NativeSelectOption key={kind} value={kindChoice(kind)}>
                  {TRANSFER_KIND_LABELS[kind]}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
            <NativeSelectOptGroup label={group.flow === "income" ? "Ingreso real (con categoría)" : "Gasto real (con categoría)"}>
              {categories
                .filter((category) => category.classification === group.flow)
                .map((category) => (
                  <NativeSelectOption key={category.id} value={categoryChoice(category.id)}>
                    {category.label ?? category.name}
                  </NativeSelectOption>
                ))}
            </NativeSelectOptGroup>
          </NativeSelect>
          <PendingSubmitButton>Aplicar a {group.count}</PendingSubmitButton>
        </ActionForm>
      )}
      detailsOpenByDefault
      renderDetails={(group) => (
        <>
          <p>
            Decídelo una vez y se aplica a estos {group.count} movimientos. Si es dinero que va a otra persona o negocio, elígelo como gasto o ingreso con su categoría; si es entre tus propias
            cuentas, como transferencia.
          </p>
          <ul className="mt-2 max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border" aria-label={`Movimientos de ${group.providerName}`}>
            {group.movements.map((movement, index) => (
              <li key={movement.id ?? index} className="flex items-center gap-3 px-3 py-1.5">
                <span className="w-14 shrink-0 tabular-nums">{formatShortDate(movement.date)}</span>
                <span className="min-w-0 flex-1 truncate text-foreground">{movement.name}</span>
                {movement.accountName && <span className="hidden shrink-0 sm:inline">{movement.accountName}</span>}
                <SignedAmountText cents={movement.amountCents} className="shrink-0" />
              </li>
            ))}
          </ul>
          {group.count > group.movements.length && <p>Mostrando los {group.movements.length} más recientes de {group.count}.</p>}
        </>
      )}
      renderHeadline={(group) => (
        <>
          <p className="text-sm leading-snug">
            <span className="font-semibold text-foreground">{group.providerName}</span>
            <span className="ml-2 text-muted-foreground">
              {group.flow === "income" ? "Ingreso" : "Gasto"} · {group.count} {group.count === 1 ? "movimiento" : "movimientos"} · {formatPesos(group.totalCents)}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {group.hint ? `${group.hint.reason} · ` : ""}último {formatShortDate(group.lastDate)}
          </p>
        </>
      )}
    />
  );
}
