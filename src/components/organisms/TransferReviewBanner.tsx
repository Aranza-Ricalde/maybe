"use client";

import { ArrowRight, TriangleExclamation } from "@gravity-ui/icons";
import { useState, type ReactNode } from "react";
import type { SuggestionTransactionView, TransferPairView, TransferSingleView, TransferSuggestionsView } from "@/application/getTransferSuggestions";
import { Icon } from "@/components/atoms/Icon";
import { ReviewAlert } from "./ReviewAlert";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import { TransferKindSelect } from "@/components/molecules/TransferKindSelect";
import { TRANSFER_KIND_SHORT_LABELS } from "@/domain/transfers/rules";
import { formatCurrencyCompact, formatPesos, formatShortDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

export interface TransferReviewActions {
  confirmPair: (formData: FormData) => void;
  dismissPair: (formData: FormData) => void;
  confirmSingle: (formData: FormData) => void;
  dismissSingle: (formData: FormData) => void;
}

type Item = { key: string; pair: TransferPairView; single?: undefined } | { key: string; single: TransferSingleView; pair?: undefined };

const Strong = ({ children }: { children: ReactNode }) => <span className="font-semibold text-foreground">{children}</span>;
const Account = ({ tx }: { tx: SuggestionTransactionView }) => <span className="text-muted">({tx.accountName})</span>;

function Sentence({ item }: { item: Item }) {
  if (item.pair) {
    const { outflow, inflow } = item.pair;
    return (
      <p className="text-sm leading-snug">
        <Strong>{outflow.name}</Strong> <Account tx={outflow} />
        <Icon icon={ArrowRight} size="sm" className="mx-1.5 inline align-[-1px] text-muted" aria-label="hacia" />
        <Strong>{inflow.name}</Strong> <Account tx={inflow} />
        <span className="ml-2 font-semibold tabular-nums">{formatCurrencyCompact(Math.abs(outflow.amountCents))}</span>
      </p>
    );
  }
  const tx = item.single.transaction;
  return (
    <p className="text-sm leading-snug">
      <Strong>{tx.name}</Strong> <Account tx={tx} />
      <span className={`ml-2 font-semibold tabular-nums ${tx.amountCents < 0 ? "" : "text-success"}`}>
        {tx.amountCents < 0 ? "−" : "+"}
        {formatCurrencyCompact(Math.abs(tx.amountCents))}
      </span>
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
      <form action={item.pair ? actions.confirmPair : actions.confirmSingle} className="flex items-center gap-2">
        {ids}
        <TransferKindSelect defaultValue={suggestion.kind} />
        <PendingSubmitButton>Confirmar</PendingSubmitButton>
      </form>
      <form action={item.pair ? actions.dismissPair : actions.dismissSingle}>
        {ids}
        <PendingSubmitButton variant="ghost" label="No es una transferencia">
          No lo es
        </PendingSubmitButton>
      </form>
    </div>
  );
}

export function TransferReviewBanner({ suggestions, actions }: { suggestions: TransferSuggestionsView; actions: TransferReviewActions }) {
  const { pairs, singles, undecidedCount, impact } = suggestions;
  const [index, setIndex] = useState(0);

  const items: Item[] = [
    ...pairs.filter((p) => p.confidence === "strong").map((pair) => ({ key: `p-${pair.outflowId}-${pair.inflowId}`, pair })),
    ...pairs.filter((p) => p.confidence !== "strong").map((pair) => ({ key: `p-${pair.outflowId}-${pair.inflowId}`, pair })),
    ...singles.map((single) => ({ key: `s-${single.transactionId}`, single })),
  ];
  if (items.length === 0) return null;

  const current = Math.min(index, items.length - 1);
  const item = items[current];
  const suggestion = item.pair ?? item.single;
  const date = item.pair ? item.pair.outflow.date : item.single.transaction.date;
  const go = (delta: number) => setIndex((current + delta + items.length) % items.length);
  const certainty = item.pair?.confidence === "strong" ? "muy probable" : "para revisar";

  return (
    <ReviewAlert
      ariaLabel="Transferencias por revisar"
      icon={TriangleExclamation}
      itemKey={item.key}
      position={{ current, total: items.length, onGo: go }}
      actions={<ItemActions key={item.key} item={item} actions={actions} />}
      details={
        <>
          <p>
            <span className="font-medium text-foreground">Por qué lo sugerimos:</span> {suggestion.reasons.join(" · ")}.
          </p>
          <p>
            Hoy cuenta como gasto o ingreso. Si lo confirmas deja de contarse, y tus saldos no cambian; lo puedes deshacer desde el movimiento. Entre las {items.length} sugerencias sumarían{" "}
            {formatPesos(impact.expenseCents)} de gasto y {formatPesos(impact.incomeCents)} de ingreso.
          </p>
          {undecidedCount > 0 && <p>Otros {undecidedCount} dicen “transferencia” o “SPEI” sin datos para saber qué son: márcalos tú desde su fila con el botón ⇄ si lo son.</p>}
        </>
      }
    >
      <Sentence item={item} />
      <p className="mt-0.5 text-xs text-muted">
        ¿{TRANSFER_KIND_SHORT_LABELS[suggestion.kind]}? · {formatShortDate(date)} · {certainty}
      </p>
    </ReviewAlert>
  );
}
