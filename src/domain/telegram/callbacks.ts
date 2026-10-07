export const CALLBACK_ACTIONS = ["ok", "change", "undo", "cat", "nav", "acct", "cancel"] as const;
export type CallbackAction = (typeof CALLBACK_ACTIONS)[number];

export interface BotCallback {
  action: CallbackAction;
  id: number;
  arg?: number;
  page?: number;
}

const SEPARATOR = ":";
const NAVIGATION_ROOT = 0;

export function encodeCallback({ action, id, arg, page }: BotCallback): string {
  return [action, id, ...(arg != null ? [arg] : []), ...(page != null ? [page] : [])].join(SEPARATOR);
}

const positive = (raw: string | undefined) => {
  const value = Number(raw);
  return raw !== undefined && Number.isSafeInteger(value) && value > 0 ? value : null;
};
const nonNegative = (raw: string | undefined) => {
  const value = Number(raw);
  return raw !== undefined && raw !== "" && Number.isSafeInteger(value) && value >= 0 ? value : null;
};

export function decodeCallback(data: string): BotCallback | null {
  const [action, rawId, rawArg, rawPage, ...extra] = data.split(SEPARATOR);
  if (extra.length > 0 || !CALLBACK_ACTIONS.includes(action as CallbackAction)) return null;
  const id = positive(rawId);
  if (id == null) return null;

  switch (action) {
    case "cat":
    case "acct": {
      const arg = positive(rawArg);
      return arg != null && rawPage === undefined ? { action, id, arg } : null;
    }
    case "nav": {
      const arg = nonNegative(rawArg ?? String(NAVIGATION_ROOT));
      const page = nonNegative(rawPage ?? "0");
      return arg != null && page != null ? { action, id, arg, page } : null;
    }
    default:
      return rawArg === undefined ? { action: action as CallbackAction, id } : null;
  }
}
