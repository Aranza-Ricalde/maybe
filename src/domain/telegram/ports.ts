export interface TelegramLinkedUser {
  id: number;
  familyId: number;
  name: string;
}

export interface ResolvedAccount {
  id: number;
  name: string;
}

export interface TelegramRepository {
  findUserByChatId(chatId: string): Promise<TelegramLinkedUser | null>;
  findAnyLinkedUser(): Promise<TelegramLinkedUser | null>;
  findFirstUser(): Promise<TelegramLinkedUser | null>;
  linkChatId(userId: number, chatId: string): Promise<void>;
  resolveAccount(familyId: number, hint: string | undefined): Promise<ResolvedAccount | null>;
  listAccountNames(familyId: number): Promise<string[]>;
}

export interface TelegramLinkCodes {
  codeFor(userId: number): string;
  matches(userId: number, provided: string | null): boolean;
}

export interface TelegramButton {
  text: string;
  data: string;
}

export interface TelegramSender {
  sendMessage(chatId: string, text: string, buttons?: TelegramButton[][]): Promise<void>;
  editMessage(chatId: string, messageId: number, text: string, buttons?: TelegramButton[][]): Promise<void>;
  answerCallback(callbackId: string, text?: string): Promise<void>;
}
