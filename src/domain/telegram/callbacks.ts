export const CALLBACK_ACTIONS = ["ok", "change", "undo", "cat"] as const;
export type CallbackAction = (typeof CALLBACK_ACTIONS)[number];

export interface CaptureCallback {
  action: CallbackAction;
  transactionId: number;
  categoryId?: number;
}

const SEPARATOR = ":";

export function encodeCallback({ action, transactionId, categoryId }: CaptureCallback): string {
  return [action, transactionId, ...(categoryId != null ? [categoryId] : [])].join(SEPARATOR);
}

export function decodeCallback(data: string): CaptureCallback | null {
  const [action, rawTransaction, rawCategory, ...extra] = data.split(SEPARATOR);
  if (extra.length > 0 || !CALLBACK_ACTIONS.includes(action as CallbackAction)) return null;
  const transactionId = Number(rawTransaction);
  if (!Number.isSafeInteger(transactionId) || transactionId <= 0) return null;
  if (action === "cat") {
    const categoryId = Number(rawCategory);
    return Number.isSafeInteger(categoryId) && categoryId > 0 ? { action, transactionId, categoryId } : null;
  }
  return rawCategory === undefined ? { action: action as CallbackAction, transactionId } : null;
}
