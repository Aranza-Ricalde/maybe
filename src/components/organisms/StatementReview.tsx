"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { NativeSelect } from "@/components/ui/native-select";
import { Text } from "@/components/atoms/Text";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { CheckCheck, Info, Link2, Trash2 } from "lucide-react";
import { MobileCollapsible } from "@/components/molecules/MobileCollapsible";
import { PillTabs } from "@/components/molecules/PillTabs";
import { SegmentedButtons } from "@/components/molecules/SegmentedButtons";
import { StatementTotalsCheck } from "@/components/molecules/StatementTotalsCheck";
import type { CategoryOption } from "@/components/viewModels";
import { importAllNew, isTransferType, linkAllHighConfidence, setAction, setCategory, setPair, setType, skipAllProbable } from "@/domain/statements/decisions";
import type { PreviewRow, RowAction } from "@/domain/statements/reconcile";
import { STATEMENT_BANK_LABELS, type StatementTransactionType } from "@/domain/statements/types";
import { formatDate, formatShortDate } from "@/lib/format";
import { useStatementReview } from "@/hooks/useStatementReview";
import { REVIEW_TAB_HELP, REVIEW_TAB_ORDER, REVIEW_TAB_TITLES, importSummaryLabel, reviewTabsShort } from "@/lib/presenters/statementReview";
import type { QueueItem } from "@/lib/statementQueue";

const TYPE_LABEL: Record<StatementTransactionType, string> = { expense: "Gasto", income: "Ingreso", internal_transfer: "Transferencia propia", card_payment: "Pago de tarjeta" };
const CONFIDENCE: Record<"high" | "medium" | "low", { label: string; variant: "success" | "warning" | "secondary" }> = { high: { label: "Muy probable", variant: "success" }, medium: { label: "Probable", variant: "warning" }, low: { label: "Posible", variant: "secondary" } };
const SOURCE_LABEL: Record<string, string> = { manual: "capturado a mano", csv_import: "importado de CSV", telegram: "de Telegram", api: "de la API", statement_import: "de otro estado" };

const ACTION_OPTIONS = (hasMatch: boolean) => [
  ...(hasMatch ? [{ value: "link" as RowAction, label: "Es el mío: vincular" }] : []),
  { value: "import" as RowAction, label: hasMatch ? "Es otro: importar" : "Importar" },
  { value: "skip" as RowAction, label: "Omitir" },
];

export function StatementReview({ item, categories }: { item: QueueItem; categories: CategoryOption[] }) {
  const review = useStatementReview(item);
  if (!review) return null;
  const importSummary = importSummaryLabel(review.summary);
  const { preview, tab, setTab, tabs, rows, busy, mismatch, highCount, canConfirm, setChoices, acknowledge, discard, confirm } = review;

  return (
    <Card aria-label={`Revisión de ${item.file.name}`}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Text weight="medium">
              {STATEMENT_BANK_LABELS[preview.bank]}
              {preview.accountLast4 ? ` · ****${preview.accountLast4}` : ""}
            </Text>
            <Text size="xs" tone="muted">
              {formatDate(preview.periodStart)} al {formatDate(preview.periodEnd)} · {preview.rows.length} movimientos
              <span className="max-md:hidden"> · {item.file.name}</span>
            </Text>
          </div>
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={discard} aria-label="Descartar este estado" className="shrink-0 text-muted-foreground max-md:size-8 max-md:p-0">
            <Trash2 className="md:hidden" aria-hidden />
            <span className="max-md:hidden">Descartar</span>
          </Button>
        </div>

        <StatementTotalsCheck checks={preview.validation.checks} />
        {preview.warnings.map((warning) => (
          <Text key={warning} size="xs" tone="warning">
            {warning}
          </Text>
        ))}
        {mismatch && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={item.acknowledgeMismatch} onCheckedChange={(checked) => acknowledge(checked === true)} />
            Entiendo que no cuadran y quiero importar de todos modos
          </label>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5 md:hidden">
            <div className="flex items-center justify-between">
              <Text size="xs" weight="medium" tone="muted">
                Qué revisar
              </Text>
              <ResponsiveDialog
                title="¿Qué significa cada pestaña?"
                size="sm"
                trigger={
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="¿Qué significa esta pestaña?" className="text-muted-foreground">
                    <Info />
                  </Button>
                }
              >
                <ul className="flex flex-col gap-3 pb-2">
                  {REVIEW_TAB_ORDER.map((key) => (
                    <li key={key} className={`rounded-xl border px-4 py-3 ${key === tab ? "border-primary/40 bg-primary/5" : "bg-card"}`}>
                      <p className="text-sm font-medium">{REVIEW_TAB_TITLES[key]}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{REVIEW_TAB_HELP[key]}</p>
                    </li>
                  ))}
                </ul>
              </ResponsiveDialog>
            </div>
            <div className="[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]">
              <PillTabs options={reviewTabsShort(preview)} value={tab} onChange={setTab} ariaLabel="Qué revisar" />
            </div>
          </div>
          <div className="max-md:hidden">
            <SegmentedButtons options={tabs} value={tab} onChange={setTab} />
          </div>
          <Text size="sm" tone="muted" className="max-md:hidden">
            {REVIEW_TAB_HELP[tab]}
          </Text>
        </div>

        {(tab === "new" || tab === "probable") && (
          <div className="flex flex-wrap items-center gap-2">
            {tab === "new" && (
              <>
                <Button type="button" size="xs" variant="outline" className="rounded-full" onClick={() => setChoices(importAllNew(preview, item.choices, true))}>
                  <CheckCheck data-icon="inline-start" />
                  Seleccionar todos
                </Button>
                <Button type="button" size="xs" variant="ghost" className="rounded-full text-muted-foreground" onClick={() => setChoices(importAllNew(preview, item.choices, false))}>
                  Quitar selección
                </Button>
              </>
            )}
            {tab === "probable" && (
              <>
                <Button type="button" size="xs" variant="outline" className="rounded-full" disabled={highCount === 0} onClick={() => setChoices(linkAllHighConfidence(preview, item.choices))}>
                  <Link2 data-icon="inline-start" />
                  Vincular muy probables ({highCount})
                </Button>
                <Button type="button" size="xs" variant="ghost" className="rounded-full text-muted-foreground" onClick={() => setChoices(skipAllProbable(preview, item.choices))}>
                  Omitir todos
                </Button>
              </>
            )}
          </div>
        )}

        {tab === "orphans" ? (
          preview.unmatchedExisting.length === 0 ? (
            <Text size="sm" tone="muted">
              Todo lo que registraste en este periodo aparece en el estado.
            </Text>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border md:max-h-[55vh] md:overflow-y-auto">
              {preview.unmatchedExisting.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <Text size="sm">
                    {formatShortDate(movement.date)} · {movement.name}
                  </Text>
                  <CurrencyText cents={movement.amountCents} size="sm" />
                </li>
              ))}
            </ul>
          )
        ) : rows.length === 0 ? (
          <Text size="sm" tone="muted" className="py-4 text-center">
            Nada por aquí.
          </Text>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border md:max-h-[55vh] md:overflow-y-auto">
            {rows.map((row) => (
              <ReviewRow key={row.index} row={row} choice={item.choices[row.index]} categories={categories} disabled={busy} onAction={(action) => setChoices(setAction(item.choices, row.index, action))} onCategory={(id) => setChoices(setCategory(item.choices, row.index, id))} onType={(type) => setChoices(setType(item.choices, row.index, type))} onPair={(pair) => setChoices(setPair(preview, item.choices, row.index, pair))} />
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="border-t">
        <ImportActionBar summary={importSummary} message={item.message} busy={busy} canConfirm={canConfirm} onConfirm={confirm} />
      </CardFooter>
    </Card>
  );
}

interface ImportActionBarProps {
  summary: { headline: string; detail: string };
  message: string | null;
  busy: boolean;
  canConfirm: boolean;
  onConfirm: () => void;
}

function ImportActionBar({ summary, message, busy, canConfirm, onConfirm }: ImportActionBarProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <Text size="sm" weight="medium">
          {summary.headline}
        </Text>
        <Text size="xs" tone={message ? "danger" : "muted"}>
          {message ?? summary.detail}
        </Text>
      </div>
      <Button type="button" disabled={!canConfirm} onClick={onConfirm} className="shrink-0">
        {busy ? "Importando…" : "Importar"}
      </Button>
    </div>
  );
}

interface RowProps {
  row: PreviewRow;
  choice: QueueItem["choices"][number];
  categories: CategoryOption[];
  disabled: boolean;
  onAction: (action: RowAction) => void;
  onCategory: (id: number | null) => void;
  onType: (type: StatementTransactionType) => void;
  onPair: (pair: boolean) => void;
}

function ReviewRow({ row, choice, categories, disabled, onAction, onCategory, onType, onPair }: RowProps) {
  const { transaction, match } = row;
  const selected = choice.action !== "skip";

  return (
    <li className={`flex flex-col gap-2 px-4 py-3 ${!selected && !row.locked && !match ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-x-3 gap-y-2 md:flex-wrap md:items-center">
        {!match && !row.locked && <Checkbox aria-label={`Importar ${transaction.description}`} disabled={disabled} checked={selected} onCheckedChange={(checked) => onAction(checked === true ? "import" : "skip")} />}
        <div className="min-w-0 flex-1 md:min-w-48">
          <Text size="sm" weight="medium" className="break-words">
            {transaction.description}
          </Text>
          <Text size="xs" tone="muted">
            {formatShortDate(transaction.date)}
            {transaction.postedDate && transaction.postedDate !== transaction.date ? ` · se reflejó el ${formatShortDate(transaction.postedDate)}` : ""} · {TYPE_LABEL[choice.type]}
          </Text>
        </div>
        {!row.locked && selected && !match && (
          <div className="max-md:hidden">
            <RowEditors choice={choice} categories={categories} disabled={disabled} onCategory={onCategory} onType={onType} />
          </div>
        )}
        <CurrencyText cents={transaction.amountCents} weight="medium" tone={transaction.amountCents > 0 ? "success" : "default"} className="shrink-0" />
      </div>

      {row.locked && <Badge variant="secondary">Ya importado antes</Badge>}

      {match && !row.locked && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant={CONFIDENCE[match.confidence].variant}>{CONFIDENCE[match.confidence].label}</Badge>
            <Text size="xs" tone="muted">
              Ya tienes «{match.name}» del {formatShortDate(match.date)} ({SOURCE_LABEL[match.source] ?? match.source})
            </Text>
          </div>
          <div className="max-md:w-full">
            <SegmentedButtons options={ACTION_OPTIONS(true)} value={choice.action} onChange={onAction} />
          </div>
        </div>
      )}

      {!row.locked && selected && match && choice.action === "import" && (
        <div className="max-md:hidden">
          <RowEditors choice={choice} categories={categories} disabled={disabled} onCategory={onCategory} onType={onType} />
        </div>
      )}
      {!row.locked && selected && (!match || choice.action === "import") && (
        <div className="md:hidden">
          <MobileCollapsible title="Cambiar tipo o categoría">
            <RowEditors choice={choice} categories={categories} disabled={disabled} onCategory={onCategory} onType={onType} />
          </MobileCollapsible>
        </div>
      )}

      {!row.locked && row.pairSuggestion && (
        <label className="flex items-center gap-2 text-xs">
          <Checkbox disabled={disabled} checked={choice.pair} onCheckedChange={(checked) => onPair(checked === true)} />
          Es el mismo dinero que el movimiento de {row.pairSuggestion.accountName} del {formatShortDate(row.pairSuggestion.date)}: emparejar como {row.pairSuggestion.kind === "cc_payment" ? "pago de tarjeta" : "transferencia propia"}
        </label>
      )}
      {!row.locked && row.sameAmountElsewhere.length > 0 && (
        <Text size="xs" tone="warning">
          Hay un movimiento del mismo monto en {row.sameAmountElsewhere.map((w) => `${w.accountName} (${formatShortDate(w.date)})`).join(", ")}. Revisa que no sea el mismo.
        </Text>
      )}
    </li>
  );
}

interface EditorsProps {
  choice: QueueItem["choices"][number];
  categories: CategoryOption[];
  disabled: boolean;
  onCategory: (id: number | null) => void;
  onType: (type: StatementTransactionType) => void;
}

function RowEditors({ choice, categories, disabled, onCategory, onType }: EditorsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect size="sm" aria-label="Tipo" disabled={disabled} value={choice.type} onChange={(e) => onType(e.target.value as StatementTransactionType)}>
        {(Object.keys(TYPE_LABEL) as StatementTransactionType[]).map((type) => (
          <option key={type} value={type}>
            {TYPE_LABEL[type]}
          </option>
        ))}
      </NativeSelect>
      {!isTransferType(choice.type) && (
        <NativeSelect size="sm" aria-label="Categoría" disabled={disabled} value={choice.categoryId ?? ""} onChange={(e) => onCategory(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Categoría automática</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label ?? category.name}
            </option>
          ))}
        </NativeSelect>
      )}
    </div>
  );
}
