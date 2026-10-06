"use client";

import { CircleQuestion } from "@gravity-ui/icons";
import { useState } from "react";
import { CategoryNativeSelect } from "@/components/molecules/CategoryNativeSelect";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import type { CategoryOption } from "@/components/viewModels";
import type { PendingCapture } from "@/domain/captures/ports";
import { formatCurrencyCompact, formatShortDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { ReviewAlert } from "./ReviewAlert";

const SOURCE_LABELS: Record<string, string> = { api: "atajo del teléfono", telegram: "Telegram" };

export interface CaptureReviewBannerProps {
  captures: PendingCapture[];
  categories: CategoryOption[];
  confirmAction: (formData: FormData) => void;
}

export function CaptureReviewBanner({ captures, categories, confirmAction }: CaptureReviewBannerProps) {
  const [index, setIndex] = useState(0);
  if (captures.length === 0) return null;

  const current = Math.min(index, captures.length - 1);
  const capture = captures[current];
  const go = (delta: number) => setIndex((current + delta + captures.length) % captures.length);
  const isExpense = capture.amountCents < 0;

  return (
    <ReviewAlert
      ariaLabel="Movimientos por confirmar"
      icon={CircleQuestion}
      itemKey={capture.transactionId}
      position={{ current, total: captures.length, onGo: go }}
      actions={
        <form key={capture.transactionId} action={confirmAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name={FIELD.transactionId} value={capture.transactionId} />
          <CategoryNativeSelect name={FIELD.categoryId} options={categories} defaultValue={capture.categoryId} />
          <PendingSubmitButton>Confirmar</PendingSubmitButton>
        </form>
      }
      details={<p>Lo registraste desde {SOURCE_LABELS[capture.source] ?? capture.source} y no estamos seguros de la categoría. Elige la correcta y confirma: la próxima vez lo reconoceremos solos.</p>}
    >
      <p className="text-sm leading-snug">
        <span className="font-semibold text-foreground">{capture.name}</span> <span className="text-muted">({capture.accountName})</span>
        <span className={`ml-2 font-semibold tabular-nums ${isExpense ? "" : "text-success"}`}>
          {isExpense ? "−" : "+"}
          {formatCurrencyCompact(Math.abs(capture.amountCents))}
        </span>
      </p>
      <p className="mt-0.5 text-xs text-muted">
        ¿{capture.categoryName ? `Es ${capture.categoryName}` : "De qué es"}? · {formatShortDate(capture.date)}
      </p>
    </ReviewAlert>
  );
}
