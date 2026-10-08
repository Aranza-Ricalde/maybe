"use client";

import { ActionForm } from "@/components/molecules/ActionForm";
import type { FormAction } from "@/lib/actionResult";
import { ArrowRight, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { SuggestionTransactionView, TransferSuggestionsView } from "@/application/getTransferSuggestions";
import { Icon } from "@/components/atoms/Icon";
import { ReviewQueueBanner } from "./ReviewQueueBanner";
import { SignedAmountText } from "@/components/atoms/SignedAmountText";
import { buildTransferReviewItems, type TransferReviewItem } from "@/lib/presenters/transferReview";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import { TransferKindSelect } from "@/components/molecules/TransferKindSelect";
import { TRANSFER_KIND_SHORT_LABELS } from "@/domain/transfers/rules";
import { formatCurrencyCompact, formatPesos, formatShortDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

export interface TransferReviewActions {
  confirmPair: FormAction;
  dismissPair: FormAction;
  confirmSingle: FormAction;
  dismissSingle: FormAction;
}

type Item = TransferReviewItem;

const Strong = ({ children }: { children: ReactNode }) => <span className="font-semibold text-foreground">{children}</span>;
const Account = ({ tx }: { tx: SuggestionTransactionView }) => <span className="text-muted-foreground">({tx.accountName})</span>;

function Sentence({ item }: { item: Item }) {
  if (item.pair) {
    const { outflow, inflow } = item.pair;
    return (
      <p className="text-sm leading-snug">
        <Strong>{outflow.name}</Strong> <Account tx={outflow} />
        <Icon icon={ArrowRight} size="sm" className="mx-1.5 inline align-[-1px] text-muted-foreground" aria-label="hacia" />
        <Strong>{inflow.name}</Strong> <Account tx={inflow} />
        <span className="ml-2 font-semibold tabular-nums">{formatCurrencyCompact(Math.abs(outflow.amountCents))}</span>
      </p>
    );
  }
  const tx = item.single.transaction;
  return (
    <p className="text-sm leading-snug">
      <Strong>{tx.name}</Strong> <Account tx={tx} />
      <SignedAmountText cents={tx.amountCents} className="ml-2" />
    </p>
  );
}

function ItemActions({ item, actions }: { item: Item; actions: TransferReviewActions }) {
  const suggestion = item.pair ?? item.single;
  const ids = item.pair ? (
    <>
      <input type="hidden" name={FIELD.outflowId} value={item.pair.outflowId} />
      <input type="hidden" name={FIELD.inflowId} value={item.pair.inflowId} />
    </>
  ) : (
    <input type="hidden" name={FIELD.transactionId} value={item.single.transactionId} />
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionForm action={item.pair ? actions.confirmPair : actions.confirmSingle} className="flex items-center gap-2">
        {ids}
        <TransferKindSelect defaultValue={suggestion.kind} />
        <PendingSubmitButton>Confirmar</PendingSubmitButton>
      </ActionForm>
      <ActionForm action={item.pair ? actions.dismissPair : actions.dismissSingle}>
        {ids}
        <PendingSubmitButton variant="ghost" label="No es una transferencia">
          No lo es
        </PendingSubmitButton>
      </ActionForm>
    </div>
  );
}

export function TransferReviewBanner({ suggestions, actions }: { suggestions: TransferSuggestionsView; actions: TransferReviewActions }) {
  const { pairs, singles, undecidedCount, impact } = suggestions;
  const items = buildTransferReviewItems(pairs, singles);

  return (
    <ReviewQueueBanner
      items={items}
      ariaLabel="Transferencias por revisar"
      icon={TriangleAlert}
      getKey={(item) => item.key}
      renderActions={(item) => <ItemActions item={item} actions={actions} />}
      renderDetails={(item, total) => (
        <>
          <p>
            <span className="font-medium text-foreground">Por qué lo sugerimos:</span> {(item.pair ?? item.single).reasons.join(" · ")}.
          </p>
          <p>
            Hoy cuenta como gasto o ingreso. Si lo confirmas deja de contarse, y tus saldos no cambian; lo puedes deshacer desde el movimiento. Entre las {total} sugerencias sumarían{" "}
            {formatPesos(impact.expenseCents)} de gasto y {formatPesos(impact.incomeCents)} de ingreso.
          </p>
          {undecidedCount > 0 && <p>Otros {undecidedCount} dicen “transferencia” o “SPEI” sin datos para saber qué son: márcalos tú desde su fila con el botón ⇄ si lo son.</p>}
        </>
      )}
      renderHeadline={(item) => {
        const suggestion = item.pair ?? item.single;
        const date = item.pair ? item.pair.outflow.date : item.single.transaction.date;
        const certainty = item.pair?.confidence === "strong" ? "muy probable" : "para revisar";
        return (
          <>
            <Sentence item={item} />
            <p className="mt-0.5 text-xs text-muted-foreground">
              ¿{TRANSFER_KIND_SHORT_LABELS[suggestion.kind]}? · {formatShortDate(date)} · {certainty}
            </p>
          </>
        );
      }}
    />
  );
}
