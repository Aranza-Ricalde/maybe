import type { PairKind, PreviewRow, RowAction, StatementPreview } from "./reconcile";
import type { StatementTransactionType } from "./types";

export interface RowChoice {
  action: RowAction;
  type: StatementTransactionType;
  categoryId: number | null;
  pair: boolean;
}

export interface StatementRowDecision {
  index: number;
  action: RowAction;
  typeOverride?: StatementTransactionType;
  categoryId?: number | null;
  linkTransactionId?: number;
  pairWithTransactionId?: number;
}

export interface ChoiceSummary {
  toImport: number;
  toLink: number;
  toSkip: number;
  toPair: number;
}

const TYPE_FOR_PAIR: Record<PairKind, StatementTransactionType> = { cc_payment: "card_payment", transfer: "internal_transfer" };
const NO_CATEGORY_TYPES: StatementTransactionType[] = ["internal_transfer", "card_payment"];

export const isTransferType = (type: StatementTransactionType) => NO_CATEGORY_TYPES.includes(type);

export function initialChoices(preview: StatementPreview): RowChoice[] {
  return preview.rows.map((row) => ({ action: row.defaultAction, type: row.transaction.type, categoryId: null, pair: false }));
}

export function setAction(choices: RowChoice[], index: number, action: RowAction): RowChoice[] {
  return choices.map((choice, i) => (i === index ? { ...choice, action, pair: action === "skip" ? false : choice.pair } : choice));
}

export function setCategory(choices: RowChoice[], index: number, categoryId: number | null): RowChoice[] {
  return choices.map((choice, i) => (i === index ? { ...choice, categoryId } : choice));
}

export function setType(choices: RowChoice[], index: number, type: StatementTransactionType): RowChoice[] {
  return choices.map((choice, i) => (i === index ? { ...choice, type, categoryId: isTransferType(type) ? null : choice.categoryId, pair: isTransferType(type) ? choice.pair : false } : choice));
}

export function setPair(preview: StatementPreview, choices: RowChoice[], index: number, pair: boolean): RowChoice[] {
  const suggestion = preview.rows[index]?.pairSuggestion;
  if (!suggestion) return choices;
  return choices.map((choice, i) => {
    if (i !== index) return choice;
    if (!pair) return { ...choice, pair: false };
    return { ...choice, pair: true, action: choice.action === "skip" ? "import" : choice.action, type: TYPE_FOR_PAIR[suggestion.kind], categoryId: null };
  });
}

const isUnlocked = (row: PreviewRow) => !row.locked;

export function linkAllHighConfidence(preview: StatementPreview, choices: RowChoice[]): RowChoice[] {
  return choices.map((choice, i) => {
    const row = preview.rows[i];
    return isUnlocked(row) && row.status === "probable_match" && row.match?.confidence === "high" ? { ...choice, action: "link" } : choice;
  });
}

export function skipAllProbable(preview: StatementPreview, choices: RowChoice[]): RowChoice[] {
  return choices.map((choice, i) => (preview.rows[i].status === "probable_match" ? { ...choice, action: "skip", pair: false } : choice));
}

export function importAllNew(preview: StatementPreview, choices: RowChoice[], selected: boolean): RowChoice[] {
  return choices.map((choice, i) => (preview.rows[i].status === "new" && !preview.rows[i].transaction.derived ? { ...choice, action: selected ? "import" : "skip", pair: selected ? choice.pair : false } : choice));
}

export function summarizeChoices(preview: StatementPreview, choices: RowChoice[]): ChoiceSummary {
  const summary: ChoiceSummary = { toImport: 0, toLink: 0, toSkip: 0, toPair: 0 };
  preview.rows.forEach((row, i) => {
    if (row.locked) return;
    const choice = choices[i];
    if (choice.action === "import") summary.toImport++;
    else if (choice.action === "link") summary.toLink++;
    else summary.toSkip++;
    if (choice.pair && choice.action !== "skip") summary.toPair++;
  });
  return summary;
}

export function toDecisions(preview: StatementPreview, choices: RowChoice[]): StatementRowDecision[] {
  return preview.rows.flatMap((row, i): StatementRowDecision[] => {
    if (row.locked) return [];
    const choice = choices[i];
    const pairWith = choice.pair && choice.action !== "skip" ? row.pairSuggestion?.transactionId : undefined;
    if (choice.action === "link") return [{ index: i, action: "link", linkTransactionId: row.match?.transactionId, ...(pairWith ? { pairWithTransactionId: pairWith } : {}) }];
    if (choice.action === "skip") return [{ index: i, action: "skip" }];
    const typeOverride = choice.type !== row.transaction.type ? choice.type : undefined;
    return [
      {
        index: i,
        action: "import",
        ...(typeOverride ? { typeOverride } : {}),
        ...(choice.categoryId != null && !isTransferType(choice.type) ? { categoryId: choice.categoryId } : {}),
        ...(pairWith ? { pairWithTransactionId: pairWith } : {}),
      },
    ];
  });
}
