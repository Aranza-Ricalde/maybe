import { encodeCallback } from "./callbacks";
import { ROOT_PARENT, type CategoryMenu } from "./categoryMenu";
import type { TelegramButton } from "./ports";

export const CATEGORY_BUTTONS_LIMIT = 8;
const BUTTONS_PER_ROW = 2;
const CONFIRM_BUTTONS_LIMIT = 6;

export interface CaptureCardData {
  transactionId: number;
  name: string;
  amountCents: number;
  accountName: string;
  categoryId: number | null;
  categoryName: string | null;
  merchantName: string | null;
  needsConfirmation: boolean;
}

export const pesos = (cents: number) => `$${(Math.abs(cents) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function captureCardText(card: CaptureCardData, footer?: string): string {
  const sign = card.amountCents < 0 ? "−" : "+";
  const lines = [`${card.amountCents < 0 ? "💸" : "💰"} ${sign}${pesos(card.amountCents)} · ${card.name}`, `🏦 ${card.accountName}`, `📂 ${card.categoryName ?? "Sin categoría"}`];
  if (card.merchantName && card.merchantName.toLowerCase() !== card.name.toLowerCase()) lines.push(`🏪 ${card.merchantName}`);
  if (footer) lines.push("", footer);
  else if (card.needsConfirmation) lines.push("", card.categoryId ? "❓ ¿Es correcta la categoría?" : "❓ ¿De qué categoría es?");
  return lines.join("\n");
}

const undoButton = (transactionId: number): TelegramButton => ({ text: "↩️ Deshacer", data: encodeCallback({ action: "undo", id: transactionId }) });

const chunkRows = (buttons: TelegramButton[]): TelegramButton[][] => {
  const rows: TelegramButton[][] = [];
  for (let index = 0; index < buttons.length; index += BUTTONS_PER_ROW) rows.push(buttons.slice(index, index + BUTTONS_PER_ROW));
  return rows;
};

export function categoryButtons(transactionId: number, categories: Array<{ id: number; name: string }>): TelegramButton[][] {
  const buttons = categories.map((category) => ({ text: category.name, data: encodeCallback({ action: "cat", id: transactionId, arg: category.id }) }));
  const showAll: TelegramButton = { text: "📚 Ver todas", data: encodeCallback({ action: "nav", id: transactionId, arg: ROOT_PARENT, page: 0 }) };
  return [...chunkRows(buttons), [showAll, undoButton(transactionId)]];
}

export function categoryMenuButtons(transactionId: number, menu: CategoryMenu): TelegramButton[][] {
  const { parent, items, page, pages } = menu;
  const nav = (arg: number, toPage: number) => encodeCallback({ action: "nav", id: transactionId, arg, page: toPage });
  const itemButtons = items.map((item) =>
    item.opensChildren
      ? { text: `📁 ${item.label}`, data: nav(item.categoryId, 0) }
      : { text: item.label, data: encodeCallback({ action: "cat", id: transactionId, arg: item.categoryId }) },
  );
  const parentId = parent?.id ?? ROOT_PARENT;
  const pager: TelegramButton[] = [
    ...(page > 0 ? [{ text: "◀️", data: nav(parentId, page - 1) }] : []),
    ...(pages > 1 ? [{ text: `${page + 1}/${pages}`, data: nav(parentId, page) }] : []),
    ...(page < pages - 1 ? [{ text: "▶️", data: nav(parentId, page + 1) }] : []),
  ];
  const useParent: TelegramButton[][] = parent ? [[{ text: `✅ ${parent.name} (general)`, data: encodeCallback({ action: "cat", id: transactionId, arg: parent.id }) }]] : [];
  const back: TelegramButton = parent ? { text: "⬅️ Categorías", data: nav(ROOT_PARENT, 0) } : { text: "⬅️ Atrás", data: encodeCallback({ action: "change", id: transactionId }) };
  return [...useParent, ...chunkRows(itemButtons), ...(pager.length > 0 ? [pager] : []), [back, undoButton(transactionId)]];
}

export function categoryMenuTitle(menu: CategoryMenu): string {
  const where = menu.parent ? `Subcategorías de ${menu.parent.name}` : "Todas las categorías";
  return menu.pages > 1 ? `${where} (página ${menu.page + 1} de ${menu.pages}):` : `${where}:`;
}

export function captureCardButtons(card: CaptureCardData, topCategories: Array<{ id: number; name: string }>): TelegramButton[][] {
  const { transactionId } = card;
  if (card.needsConfirmation && card.categoryId == null) return categoryButtons(transactionId, topCategories.slice(0, CONFIRM_BUTTONS_LIMIT));
  const change: TelegramButton = { text: "📂 Cambiar", data: encodeCallback({ action: "change", id: transactionId }) };
  if (card.needsConfirmation) return [[{ text: "✅ Sí", data: encodeCallback({ action: "ok", id: transactionId }) }, change, undoButton(transactionId)]];
  return [[change, undoButton(transactionId)]];
}

export interface DraftSummary {
  amountCents: number;
  description: string;
}

export function accountQuestionText(draft: DraftSummary): string {
  const sign = draft.amountCents < 0 ? "−" : "+";
  return `${draft.amountCents < 0 ? "💸" : "💰"} ${sign}${pesos(draft.amountCents)} · ${draft.description}\n\n🏦 ¿En qué cuenta lo registro?`;
}

export function accountButtons(draftId: number, accounts: Array<{ id: number; name: string }>, lastUsedAccountId: number | null): TelegramButton[][] {
  const ordered = [...accounts].sort((a, b) => Number(b.id === lastUsedAccountId) - Number(a.id === lastUsedAccountId));
  const buttons = ordered.map((account) => ({ text: `${account.id === lastUsedAccountId ? "⭐ " : ""}${account.name}`, data: encodeCallback({ action: "acct", id: draftId, arg: account.id }) }));
  return [...chunkRows(buttons), [{ text: "✖️ Cancelar", data: encodeCallback({ action: "cancel", id: draftId }) }]];
}

export interface BalanceLine {
  name: string;
  balanceCents: number;
  isLiability: boolean;
}

export function balancesText(lines: BalanceLine[]): string {
  if (lines.length === 0) return "No tienes cuentas activas.";
  const assets = lines.filter((line) => !line.isLiability);
  const debts = lines.filter((line) => line.isLiability);
  const money = (cents: number) => `${cents < 0 ? "−" : ""}${pesos(cents)}`;
  const block = (title: string, rows: BalanceLine[]) => (rows.length === 0 ? [] : [title, ...rows.map((row) => `• ${row.name}: ${money(row.balanceCents)}`)]);
  const total = assets.reduce((sum, row) => sum + row.balanceCents, 0);
  return [...block("🏦 Cuentas", assets), ...(assets.length > 1 ? [`Total: ${money(total)}`] : []), ...(debts.length > 0 && assets.length > 0 ? [""] : []), ...block("💳 Deudas y tarjetas", debts)].join("\n");
}

export interface RecentLine {
  date: string;
  name: string;
  amountCents: number;
  accountName: string;
  categoryName: string | null;
}

export function recentText(rows: RecentLine[]): string {
  if (rows.length === 0) return "Todavía no hay movimientos.";
  return ["🧾 Últimos movimientos", ...rows.map((row) => `${row.amountCents < 0 ? "−" : "+"}${pesos(row.amountCents)} · ${row.name}\n   ${row.date} · ${row.accountName} · ${row.categoryName ?? "sin categoría"}`)].join("\n");
}

export interface SummaryData {
  label: string;
  incomeCents: number;
  expenseCents: number;
  topCategories: Array<{ name: string; totalCents: number }>;
}

export function summaryText({ label, incomeCents, expenseCents, topCategories }: SummaryData): string {
  const net = incomeCents - Math.abs(expenseCents);
  return [
    `📊 Resumen · ${label}`,
    `💰 Ingresos: ${pesos(incomeCents)}`,
    `💸 Gastos: ${pesos(expenseCents)}`,
    `${net < 0 ? "🔻" : "🔺"} Balance: ${net < 0 ? "−" : ""}${pesos(net)}`,
    ...(topCategories.length > 0 ? ["", "Donde más gastaste:", ...topCategories.map((category) => `• ${category.name}: ${pesos(category.totalCents)}`)] : []),
  ].join("\n");
}

export const HELP_TEXT = [
  "Para registrar escribe monto y descripción:",
  "• 150 tacos  → gasto",
  "• +20000 nómina  → ingreso",
  "• 150 tacos ayer  → con fecha (hoy, ayer, anteayer, 05/10, 5 de octubre, 2026-10-05)",
  "• 150 tacos #bbva  → en otra cuenta (parte del nombre)",
  "• o pega la notificación de tu banco",
  "",
  "Comandos:",
  "/saldo [cuenta]  → saldos",
  "/ultimos [n]  → últimos movimientos (por defecto 5, máximo 15)",
  "/resumen  → ingresos y gastos del periodo actual",
].join("\n");
