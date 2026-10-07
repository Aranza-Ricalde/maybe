"use client";

import { Card } from "@heroui/react";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Select } from "@/components/atoms/Select";
import { Text } from "@/components/atoms/Text";
import { ACTIVE_ACCENT, SegmentedButtons } from "@/components/molecules/SegmentedButtons";
import { StatementTotalsCheck } from "@/components/molecules/StatementTotalsCheck";
import type { CategoryOption } from "@/components/viewModels";
import { importAllNew, isTransferType, linkAllHighConfidence, setAction, setCategory, setPair, setType, skipAllProbable, summarizeChoices } from "@/domain/statements/decisions";
import type { PreviewRow, RowAction } from "@/domain/statements/reconcile";
import { STATEMENT_BANK_LABELS, type StatementTransactionType } from "@/domain/statements/types";
import { formatDate, formatShortDate } from "@/lib/format";
import type { QueueItem } from "@/lib/statementQueue";
import { useStatementImport } from "./StatementImportProvider";

type Tab = "new" | "probable" | "imported" | "orphans";

const TYPE_LABEL: Record<StatementTransactionType, string> = { expense: "Gasto", income: "Ingreso", internal_transfer: "Transferencia propia", card_payment: "Pago de tarjeta" };
const CONFIDENCE: Record<"high" | "medium" | "low", { label: string; tone: "success" | "warning" | "muted" }> = { high: { label: "Muy probable", tone: "success" }, medium: { label: "Probable", tone: "warning" }, low: { label: "Posible", tone: "muted" } };
const SOURCE_LABEL: Record<string, string> = { manual: "capturado a mano", csv_import: "importado de CSV", telegram: "de Telegram", api: "de la API", statement_import: "de otro estado" };

const TAB_HELP: Record<Tab, string> = {
  new: "Movimientos del PDF que todavía no tienes en la app. Los marcados se van a crear.",
  probable: "Estos movimientos del PDF se parecen a algo que ya registraste (mismo monto y fecha cercana). Por defecto se omiten para no duplicar. Vincular marca el tuyo como conciliado sin cambiar su categoría, notas ni nombre.",
  imported: "Ya se importaron desde un estado anterior. No se vuelven a importar.",
  orphans: "Solo informativo: movimientos tuyos de este periodo que el PDF no respalda. Revísalos por si hay un error de captura.",
};

const ACTION_OPTIONS = (hasMatch: boolean) => [
  ...(hasMatch ? [{ value: "link" as RowAction, label: "Es el mío: vincular" }] : []),
  { value: "import" as RowAction, label: hasMatch ? "Es otro: importar" : "Importar" },
  { value: "skip" as RowAction, label: "Omitir" },
];

export function StatementReview({ item, categories }: { item: QueueItem; categories: CategoryOption[] }) {
  const { dispatch, confirm } = useStatementImport();
  const preview = item.preview;
  const [tab, setTab] = useState<Tab>("new");
  if (!preview) return null;

  const busy = item.status === "confirming";
  const summary = summarizeChoices(preview, item.choices);
  const mismatch = !preview.validation.checks.every((check) => check.expected === check.actual);
  const canConfirm = !busy && (!mismatch || item.acknowledgeMismatch) && summary.toImport + summary.toLink > 0;
  const setChoices = (choices: typeof item.choices) => dispatch({ type: "setChoices", id: item.id, choices });
  const highCount = preview.rows.filter((row) => row.status === "probable_match" && row.match?.confidence === "high").length;
  const rows = preview.rows.filter((row) => (tab === "new" ? row.status === "new" : tab === "probable" ? row.status === "probable_match" : row.status === "already_imported"));
  const tabs: Array<{ value: Tab; label: string }> = [
    { value: "new", label: `Nuevos (${preview.counts.new})` },
    { value: "probable", label: `Ya los tengo (${preview.counts.probableMatch})` },
    { value: "imported", label: `Ya importados (${preview.counts.alreadyImported})` },
    { value: "orphans", label: `Solo en mi app (${preview.unmatchedExisting.length})` },
  ];

  return (
    <Card className="gap-0 p-0" aria-label={`Revisión de ${item.file.name}`}>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Text weight="medium">
              {STATEMENT_BANK_LABELS[preview.bank]}
              {preview.accountLast4 ? ` · ****${preview.accountLast4}` : ""}
            </Text>
            <Text size="xs" tone="muted">
              {formatDate(preview.periodStart)} al {formatDate(preview.periodEnd)} · {item.file.name} · {preview.rows.length} movimientos
            </Text>
          </div>
          <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => dispatch({ type: "remove", id: item.id })}>
            Descartar
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
            <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={item.acknowledgeMismatch} onChange={(e) => dispatch({ type: "acknowledge", id: item.id, value: e.target.checked })} />
            Entiendo que no cuadran y quiero importar de todos modos
          </label>
        )}

        <div className="flex flex-col gap-2">
          <SegmentedButtons options={tabs} value={tab} onChange={setTab} activeClassName={ACTIVE_ACCENT} />
          <Text size="sm" tone="muted">
            {TAB_HELP[tab]}
          </Text>
        </div>

        {(tab === "new" || tab === "probable") && (
          <div className="flex flex-wrap gap-2">
            {tab === "new" && (
              <>
                <Button size="sm" variant="secondary" onPress={() => setChoices(importAllNew(preview, item.choices, true))}>
                  Seleccionar todos
                </Button>
                <Button size="sm" variant="secondary" onPress={() => setChoices(importAllNew(preview, item.choices, false))}>
                  Quitar selección
                </Button>
              </>
            )}
            {tab === "probable" && (
              <>
                <Button size="sm" variant="secondary" isDisabled={highCount === 0} onPress={() => setChoices(linkAllHighConfidence(preview, item.choices))}>
                  Vincular los muy probables ({highCount})
                </Button>
                <Button size="sm" variant="secondary" onPress={() => setChoices(skipAllProbable(preview, item.choices))}>
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
            <ul className="flex max-h-[55vh] flex-col divide-y divide-separator overflow-y-auto rounded-2xl border border-separator">
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
          <ul className="flex max-h-[55vh] flex-col divide-y divide-separator overflow-y-auto rounded-2xl border border-separator">
            {rows.map((row) => (
              <ReviewRow key={row.index} row={row} choice={item.choices[row.index]} categories={categories} disabled={busy} onAction={(action) => setChoices(setAction(item.choices, row.index, action))} onCategory={(id) => setChoices(setCategory(item.choices, row.index, id))} onType={(type) => setChoices(setType(item.choices, row.index, type))} onPair={(pair) => setChoices(setPair(preview, item.choices, row.index, pair))} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator px-5 py-4">
        <div className="flex flex-col">
          <Text size="sm" weight="medium">
            {summary.toImport} por crear · {summary.toLink} por vincular · {summary.toSkip} omitidos
          </Text>
          {item.message && (
            <Text size="xs" tone="danger">
              {item.message}
            </Text>
          )}
        </div>
        <Button isDisabled={!canConfirm} onPress={() => void confirm(item.id)}>
          {busy ? "Importando…" : `Confirmar (${summary.toImport + summary.toLink})`}
        </Button>
      </div>
    </Card>
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {!match && !row.locked && <input type="checkbox" aria-label={`Importar ${transaction.description}`} disabled={disabled} className="size-4 accent-[var(--accent)]" checked={selected} onChange={(e) => onAction(e.target.checked ? "import" : "skip")} />}
        <div className="min-w-48 flex-1">
          <Text size="sm" weight="medium" className="break-words">
            {transaction.description}
          </Text>
          <Text size="xs" tone="muted">
            {formatShortDate(transaction.date)}
            {transaction.postedDate && transaction.postedDate !== transaction.date ? ` · se reflejó el ${formatShortDate(transaction.postedDate)}` : ""} · {TYPE_LABEL[choice.type]}
          </Text>
        </div>
        {!row.locked && selected && !match && <RowEditors choice={choice} categories={categories} disabled={disabled} onCategory={onCategory} onType={onType} />}
        <CurrencyText cents={transaction.amountCents} weight="medium" tone={transaction.amountCents > 0 ? "success" : "default"} className="shrink-0" />
      </div>

      {row.locked && <Chip tone="muted">Ya importado antes</Chip>}

      {match && !row.locked && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Chip tone={CONFIDENCE[match.confidence].tone}>{CONFIDENCE[match.confidence].label}</Chip>
            <Text size="xs" tone="muted">
              Ya tienes «{match.name}» del {formatShortDate(match.date)} ({SOURCE_LABEL[match.source] ?? match.source})
            </Text>
          </div>
          <SegmentedButtons options={ACTION_OPTIONS(true)} value={choice.action} onChange={onAction} activeClassName={ACTIVE_ACCENT} />
        </div>
      )}

      {!row.locked && selected && match && choice.action === "import" && <RowEditors choice={choice} categories={categories} disabled={disabled} onCategory={onCategory} onType={onType} />}

      {!row.locked && row.pairSuggestion && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" className="size-4 accent-[var(--accent)]" disabled={disabled} checked={choice.pair} onChange={(e) => onPair(e.target.checked)} />
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
      <Select uiSize="sm" aria-label="Tipo" disabled={disabled} value={choice.type} onChange={(e) => onType(e.target.value as StatementTransactionType)}>
        {(Object.keys(TYPE_LABEL) as StatementTransactionType[]).map((type) => (
          <option key={type} value={type}>
            {TYPE_LABEL[type]}
          </option>
        ))}
      </Select>
      {!isTransferType(choice.type) && (
        <Select uiSize="sm" aria-label="Categoría" disabled={disabled} value={choice.categoryId ?? ""} onChange={(e) => onCategory(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Categoría automática</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label ?? category.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
