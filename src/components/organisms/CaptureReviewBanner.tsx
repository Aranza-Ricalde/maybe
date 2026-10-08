"use client";

import { ActionForm } from "@/components/molecules/ActionForm";
import type { FormAction } from "@/lib/actionResult";
import { CircleQuestionMark } from "lucide-react";
import { SignedAmountText } from "@/components/atoms/SignedAmountText";
import { CategoryNativeSelect } from "@/components/molecules/CategoryNativeSelect";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import type { CategoryOption } from "@/components/viewModels";
import type { PendingCapture } from "@/domain/captures/ports";
import { formatShortDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { ReviewQueueBanner } from "./ReviewQueueBanner";

const SOURCE_LABELS: Record<string, string> = { api: "atajo del teléfono", telegram: "Telegram" };

export interface CaptureReviewBannerProps {
  captures: PendingCapture[];
  categories: CategoryOption[];
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
          <CategoryNativeSelect name={FIELD.categoryId} options={categories} defaultValue={capture.categoryId} />
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
