export interface TelegramMessageUpdate {
  kind: "message";
  updateId: number | null;
  chatId: string;
  text: string;
}

export interface TelegramCallbackUpdate {
  kind: "callback";
  updateId: number | null;
  chatId: string;
  callbackId: string;
  messageId: number;
  data: string;
}

export type TelegramUpdate = TelegramMessageUpdate | TelegramCallbackUpdate;

const MAX_TEXT_LENGTH = 1000;

const asRecord = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);

function chatIdOf(chat: unknown): string | null {
  const id = asRecord(chat)?.id;
  return typeof id === "number" || typeof id === "string" ? String(id) : null;
}

export function parseTelegramUpdate(payload: unknown): TelegramUpdate | null {
  const root = asRecord(payload);
  if (!root) return null;
  const updateId = typeof root.update_id === "number" ? root.update_id : null;

  const message = asRecord(root.message);
  if (message) {
    const chatId = chatIdOf(message.chat);
    if (typeof message.text !== "string" || message.text.length === 0 || !chatId) return null;
    return { kind: "message", updateId, chatId, text: message.text.slice(0, MAX_TEXT_LENGTH) };
  }

  const callback = asRecord(root.callback_query);
  const callbackMessage = asRecord(callback?.message);
  if (callback && callbackMessage) {
    const chatId = chatIdOf(callbackMessage.chat);
    if (typeof callback.id !== "string" || typeof callback.data !== "string" || typeof callbackMessage.message_id !== "number" || !chatId) return null;
    return { kind: "callback", updateId, chatId, callbackId: callback.id, messageId: callbackMessage.message_id, data: callback.data };
  }
  return null;
}
