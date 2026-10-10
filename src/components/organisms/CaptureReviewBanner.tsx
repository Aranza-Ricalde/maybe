"use client";

import { ActionForm } from "@/components/molecules/ActionForm";
import type { FormAction } from "@/lib/actionResult";
import { CircleQuestionMark } from "lucide-react";
import { SignedAmountText } from "@/components/atoms/SignedAmountText";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { TRANSFER_KIND_LABELS } from "@/domain/transfers/rules";
import { TRANSFER_CHOICES, categoryChoice, flowOfAmount, kindChoice } from "@/lib/presenters/reviewChoices";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import type { ReviewCategoryOption } from "./CategoryReviewBanner";
import type { PendingCapture } from "@/domain/captures/ports";
import { formatShortDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { ReviewQueueBanner } from "./ReviewQueueBanner";

const SOURCE_LABELS: Record<string, string> = { api: "atajo del teléfono", telegram: "Telegram" };

export interface CaptureReviewBannerProps {
  captures: PendingCapture[];
  categories: ReviewCategoryOption[];
  confirmAction: FormAction;
}

export function CaptureReviewBanner({ captures, categories, confirmAction }: CaptureReviewBannerProps) {
  return (
    <ReviewQueueBanner
      items={captures}
      ariaLabel="Movimientos por confirmar"
      icon={CircleQuestionMark}
      getKey={(capture) => capture.transactionId}
      renderActions={(capture) => (
        <ActionForm action={confirmAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name={FIELD.transactionId} value={capture.transactionId} />
          <NativeSelect size="sm" name={FIELD.choice} defaultValue={capture.categoryId != null ? categoryChoice(capture.categoryId) : ""} aria-label="Categoría" className="max-w-64">
            <NativeSelectOption value="">Sin categoría</NativeSelectOption>
            <NativeSelectOptGroup label="No cuenta como gasto ni ingreso">
              {TRANSFER_CHOICES[flowOfAmount(capture.amountCents)].map((kind) => (
                <NativeSelectOption key={kind} value={kindChoice(kind)}>
                  {TRANSFER_KIND_LABELS[kind]}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
            <NativeSelectOptGroup label={flowOfAmount(capture.amountCents) === "income" ? "Ingreso real (con categoría)" : "Gasto real (con categoría)"}>
              {categories
                .filter((category) => category.classification === flowOfAmount(capture.amountCents))
                .map((category) => (
                  <NativeSelectOption key={category.id} value={categoryChoice(category.id)}>
                    {category.label ?? category.name}
                  </NativeSelectOption>
                ))}
            </NativeSelectOptGroup>
          </NativeSelect>
          <PendingSubmitButton>Confirmar</PendingSubmitButton>
        </ActionForm>
      )}
      renderDetails={(capture) => <p>Lo registraste desde {SOURCE_LABELS[capture.source] ?? capture.source} y no estamos seguros de la categoría. Elige la correcta y confirma: la próxima vez lo reconoceremos solos.</p>}
      renderHeadline={(capture) => (
        <>
          <p className="text-sm leading-snug">
            <span className="font-semibold text-foreground">{capture.name}</span> <span className="text-muted-foreground">({capture.accountName})</span>
            <SignedAmountText cents={capture.amountCents} className="ml-2" />
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ¿{capture.categoryName ? `Es ${capture.categoryName}` : "De qué es"}? · {formatShortDate(capture.date)}
          </p>
        </>
      )}
    />
  );
}
