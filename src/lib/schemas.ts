import { z } from "zod";
import { MAX_CATEGORY_DESCRIPTION_LENGTH } from "@/domain/categories/descriptions";
import { PERIOD_VIEWS } from "@/domain/payPeriod/periodView";
import { ACCOUNT_TYPES } from "@/domain/accounts/rules";
import { BUDGET_CADENCES } from "@/domain/budget/rules";
import { DEFAULT_CATEGORY_COLOR } from "@/domain/categories/palette";
import { InvalidSpendingNatureError, parseSpendingNatureFormValue } from "@/domain/categories/nature";
import { NO_PARENT_FORM_VALUE } from "@/domain/categories/rules";
import { EVOLUTION_RANGES } from "@/domain/evolution/rules";
import { FLOWS, MAX_AMOUNT_CENTS, MAX_TRANSACTION_NAME_LENGTH } from "@/domain/ledger/rules";
import { SPENDING_NATURES } from "@/domain/categories/nature";
import { MAX_SUBSCRIPTION_GROUP_NAME_LENGTH } from "@/domain/spendingAnalysis/subscriptions";
import { CAPTURE_TYPES, MAX_CAPTURE_DESCRIPTION_LENGTH, MAX_CAPTURE_NOTES_LENGTH } from "@/domain/captures/rules";
import { pesosToCents } from "@/domain/shared/money";
import { FIELD, FORM_VALUE } from "./formFields";
import { MAX_PESOS, idField, isoDateField, nonZeroPesosField, optionalIdField, optionalText, pageField, pageSizeField, pesosField, positivePesosField, requiredText } from "./forms";

const toArray = (value: unknown) => (Array.isArray(value) ? value : value == null ? [] : [value]);
const emptyToUndefined = (value: unknown) => (value === "" || value == null ? undefined : value);
const blankOrNumber = z.union([z.literal("").transform(() => null), z.coerce.number().refine(Number.isFinite)]).optional();
const MAX_NAME = 100;

export const idForm = z.object({ [FIELD.id]: idField });
export const categoryIdForm = z.object({ [FIELD.categoryId]: idField });
export const accountIdForm = z.object({ [FIELD.accountId]: idField });

const withId = <S extends z.ZodRawShape>(shape: S) => z.object({ ...shape, [FIELD.id]: idField });

const transactionShape = {
  [FIELD.accountId]: idField,
  [FIELD.categoryId]: optionalIdField,
  [FIELD.amount]: nonZeroPesosField,
  [FIELD.name]: requiredText(MAX_TRANSACTION_NAME_LENGTH),
  [FIELD.date]: isoDateField,
};
const toTransactionInput = (form: z.output<z.ZodObject<typeof transactionShape>>) => ({
  accountId: form[FIELD.accountId],
  categoryId: form[FIELD.categoryId],
  amountCents: pesosToCents(form[FIELD.amount]),
  name: form[FIELD.name],
  date: form[FIELD.date],
});
export const transactionForm = z.object(transactionShape).transform(toTransactionInput);
export const updateTransactionForm = withId(transactionShape).transform((form) => ({ id: form[FIELD.id], ...toTransactionInput(form) }));

export const transferForm = z
  .object({
    [FIELD.kind]: z.enum(["transfer", "cc_payment", "loan_payment"]),
    [FIELD.fromAccountId]: idField,
    [FIELD.toAccountId]: idField,
    [FIELD.amount]: nonZeroPesosField,
    [FIELD.date]: isoDateField,
    [FIELD.notes]: optionalText(500),
  })
  .transform((form) => ({
    kind: form[FIELD.kind],
    fromAccountId: form[FIELD.fromAccountId],
    toAccountId: form[FIELD.toAccountId],
    amountCents: pesosToCents(form[FIELD.amount]),
    date: form[FIELD.date],
    notes: form[FIELD.notes],
  }));

export const transactionFiltersArg = z.object({
  accountId: idField.optional(),
  categoryId: idField.optional(),
  kindGroup: z.enum(["standard", "transfers"]).optional(),
  fromDate: isoDateField.optional(),
  toDate: isoDateField.optional(),
  minAmountCents: z.number().int().min(0).max(MAX_AMOUNT_CENTS).optional(),
  maxAmountCents: z.number().int().min(0).max(MAX_AMOUNT_CENTS).optional(),
  search: z.string().max(100).optional(),
});
export const transactionSortArg = z.object({ field: z.enum(["date", "amount", "name"]), direction: z.enum(["asc", "desc"]) });
export const pageArgs = z.object({ page: pageField, pageSize: pageSizeField });
export const transactionsPageArgs = z.object({ filters: transactionFiltersArg, sort: transactionSortArg }).extend(pageArgs.shape);
export const accountPageArgs = z.object({ accountId: idField, fromDate: isoDateField, toDate: isoDateField }).extend(pageArgs.shape);
export const balanceHistoryArgs = z.object({ accountId: idField, range: z.enum(EVOLUTION_RANGES) });

const accountBaseForm = {
  [FIELD.name]: requiredText(MAX_NAME),
  [FIELD.type]: z.enum(ACCOUNT_TYPES),
  [FIELD.creditLimitCents]: z.preprocess(emptyToUndefined, pesosField.optional()),
};
const creditLimitCentsOf = (pesos: number | undefined) => (pesos === undefined ? undefined : pesosToCents(pesos));

export const accountCreateForm = z.object(accountBaseForm).transform((form) => ({
  name: form[FIELD.name],
  type: form[FIELD.type],
  creditLimitCents: creditLimitCentsOf(form[FIELD.creditLimitCents]),
}));
export const accountUpdateForm = z
  .object({
    ...accountBaseForm,
    [FIELD.accountId]: idField,
    [FIELD.annualRatePct]: blankOrNumber,
    [FIELD.minimumPayment]: blankOrNumber,
    [FIELD.paymentDueDay]: blankOrNumber,
  })
  .transform((form) => {
    const minimumPayment = form[FIELD.minimumPayment];
    const annualRatePct = form[FIELD.annualRatePct];
    return {
      accountId: form[FIELD.accountId],
      name: form[FIELD.name],
      type: form[FIELD.type],
      creditLimitCents: creditLimitCentsOf(form[FIELD.creditLimitCents]),
      debtTerms:
        annualRatePct === undefined
          ? undefined
          : { annualRatePct, minimumPaymentCents: minimumPayment == null ? null : pesosToCents(minimumPayment), paymentDueDay: form[FIELD.paymentDueDay] ?? null },
    };
  });

const goalShape = {
  [FIELD.name]: requiredText(MAX_NAME),
  [FIELD.targetAmount]: positivePesosField,
  [FIELD.targetDate]: z.preprocess(emptyToUndefined, isoDateField.optional()).transform((value) => value ?? null),
  [FIELD.accountIds]: z.preprocess(toArray, z.array(idField).max(50)),
};
const toGoalInput = (form: z.output<z.ZodObject<typeof goalShape>>) => ({
  name: form[FIELD.name],
  targetAmountCents: pesosToCents(form[FIELD.targetAmount]),
  targetDate: form[FIELD.targetDate],
  accountIds: form[FIELD.accountIds],
});
export const goalForm = z.object(goalShape).transform(toGoalInput);
export const goalUpdateForm = withId(goalShape).transform((form) => ({ id: form[FIELD.id], ...toGoalInput(form) }));

export const budgetLineForm = z
  .object({ [FIELD.categoryId]: idField, [FIELD.cadence]: z.enum(BUDGET_CADENCES), [FIELD.amount]: positivePesosField })
  .transform((form) => ({ categoryId: form[FIELD.categoryId], cadence: form[FIELD.cadence], budgetedAmountCents: pesosToCents(form[FIELD.amount]) }));

const recurringItemShape = {
  [FIELD.name]: requiredText(MAX_NAME),
  [FIELD.flow]: z.enum(FLOWS),
  [FIELD.estimatedAmount]: positivePesosField,
  [FIELD.dayOfMonth]: z.coerce.number().int().min(1).max(31),
  [FIELD.categoryId]: optionalIdField,
  [FIELD.accountId]: optionalIdField,
};
const toRecurringItemInput = (form: z.output<z.ZodObject<typeof recurringItemShape>>) => ({
  name: form[FIELD.name],
  flow: form[FIELD.flow],
  estimatedAmount: form[FIELD.estimatedAmount],
  dayOfMonth: form[FIELD.dayOfMonth],
  categoryId: form[FIELD.categoryId],
  accountId: form[FIELD.accountId],
});
export const recurringItemForm = z.object(recurringItemShape).transform(toRecurringItemInput);
export const recurringItemUpdateForm = withId(recurringItemShape).transform((form) => ({ id: form[FIELD.id], ...toRecurringItemInput(form) }));
export const toggleRecurringForm = z.object({ [FIELD.id]: idField, [FIELD.nextStatus]: z.string() });
export const decideRecurringBudgetForm = z.object({
  [FIELD.recurringItemId]: idField,
  [FIELD.decision]: z.string().max(40),
  [FIELD.rememberForAll]: z.preprocess((value) => value === FORM_VALUE.checkboxOn, z.boolean()),
});

export const periodForm = z.object({ [FIELD.start]: isoDateField, [FIELD.end]: isoDateField });
export const periodUpdateForm = periodForm.extend({ [FIELD.id]: idField });

const parentIdField = z.unknown().transform((value) => {
  if (value == null) return undefined;
  if (value === NO_PARENT_FORM_VALUE || value === "") return null;
  const parsed = idField.safeParse(value);
  return parsed.success ? parsed.data : undefined;
});

const natureField = z.unknown().transform((value) => {
  if (value === undefined) return undefined;
  try {
    return parseSpendingNatureFormValue(value as FormDataEntryValue);
  } catch (error) {
    if (error instanceof InvalidSpendingNatureError) return undefined;
    throw error;
  }
});

const categoryFormShape = {
  [FIELD.name]: requiredText(60),
  [FIELD.classification]: z.enum(FLOWS),
  [FIELD.color]: z.string().trim().max(20).optional(),
  [FIELD.parentId]: parentIdField,
  [FIELD.nature]: natureField,
  [FIELD.description]: optionalText(MAX_CATEGORY_DESCRIPTION_LENGTH).optional(),
};

const categoryDetails = (form: { name: string; classification: (typeof FLOWS)[number]; color?: string; parentId: number | null | undefined; nature: ReturnType<typeof parseSpendingNatureFormValue> | undefined; description?: string | null }) => ({
  name: form.name,
  classification: form.classification,
  color: form.color || DEFAULT_CATEGORY_COLOR,
  parentId: form.parentId,
  nature: form.nature,
  description: form.description,
});

export const categoryForm = z.object(categoryFormShape).transform((form) => categoryDetails({ ...form, parentId: form[FIELD.parentId], nature: form[FIELD.nature], description: form[FIELD.description] }));
export const categoryUpdateForm = z
  .object({ ...categoryFormShape, [FIELD.id]: idField })
  .transform((form) => ({ id: form[FIELD.id], ...categoryDetails({ ...form, parentId: form[FIELD.parentId], nature: form[FIELD.nature], description: form[FIELD.description] }) }));

export const occurrenceDecisionForm = z.object({ [FIELD.occurrenceId]: idField, [FIELD.decision]: z.string().max(40) });
export const linkPaymentForm = z.object({ [FIELD.occurrenceId]: idField, [FIELD.transactionId]: idField });
export const occurrenceArgs = z.object({ occurrenceId: idField });

export const minimumBalanceForm = z
  .object({ [FIELD.minimum]: z.string().trim().min(1) })
  .transform((form) => ({ minimum: Number(form[FIELD.minimum]) }))
  .refine((form) => Number.isFinite(form.minimum) && Math.abs(form.minimum) <= 1_000_000_000);

export const transferKindForm = z.string().max(40);
export const confirmTransferPairForm = z.object({ [FIELD.outflowId]: idField, [FIELD.inflowId]: idField, [FIELD.kind]: transferKindForm });
export const dismissTransferPairForm = z.object({ [FIELD.outflowId]: idField, [FIELD.inflowId]: idField });
export const confirmTransferSingleForm = z.object({ [FIELD.transactionId]: idField, [FIELD.kind]: transferKindForm });
export const transactionIdForm = z.object({ [FIELD.transactionId]: idField });

const captureAmount = z
  .union([z.number(), z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/, "monto inválido").transform((value) => Number(value.replace(",", ".")))])
  .refine((value) => Number.isFinite(value) && value > 0 && value <= MAX_PESOS, "monto fuera de rango");

export const capturePayload = z
  .object({
    account: requiredText(MAX_NAME),
    type: z.enum(CAPTURE_TYPES),
    amount: captureAmount,
    description: requiredText(MAX_CAPTURE_DESCRIPTION_LENGTH),
    date: isoDateField.optional(),
    notes: optionalText(MAX_CAPTURE_NOTES_LENGTH).optional(),
  })
  .transform(({ account, type, amount, description, date, notes }) => ({ accountName: account, movement: { type, amountCents: pesosToCents(amount), description, date, notes: notes ?? undefined } }));

export const confirmCaptureForm = z.object({ [FIELD.transactionId]: idField, [FIELD.categoryId]: optionalIdField });

export const mergeSubscriptionsForm = z.object({
  [FIELD.members]: z.preprocess(toArray, z.array(requiredText(MAX_NAME)).min(2).max(20)),
  [FIELD.name]: requiredText(MAX_SUBSCRIPTION_GROUP_NAME_LENGTH),
});

const optionalPositiveId = z.preprocess((value) => (value === "" || value == null ? null : value), idField.nullable());

export const explorerArgs = z
  .object({
    from: isoDateField,
    to: isoDateField,
    accountId: optionalPositiveId,
    categoryId: optionalPositiveId,
    merchant: z.preprocess((value) => (value === "" || value == null ? null : value), z.string().trim().min(1).max(100).nullable()),
    nature: z.preprocess((value) => (value === "" || value == null ? null : value), z.enum(SPENDING_NATURES).nullable()),
  })
  .strict();

const MAX_STATEMENT_DECISIONS = 2_000;
const statementRowId = z.number().int().positive();

export const statementDecisionsPayload = z
  .array(
    z.object({
      index: z.number().int().min(0),
      action: z.enum(["import", "link", "skip"]),
      typeOverride: z.enum(["expense", "income", "internal_transfer", "card_payment"]).optional(),
      categoryId: statementRowId.nullable().optional(),
      linkTransactionId: statementRowId.optional(),
      pairWithTransactionId: statementRowId.optional(),
    }),
  )
  .max(MAX_STATEMENT_DECISIONS);

export const periodViewForm = z.object({ view: z.enum(PERIOD_VIEWS) });
