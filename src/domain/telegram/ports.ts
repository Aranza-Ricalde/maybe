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
}

export interface TelegramSender {
  sendMessage(chatId: string, text: string): Promise<void>;
}
