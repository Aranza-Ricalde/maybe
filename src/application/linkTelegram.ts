import type { TelegramRepository, TelegramSender } from "@/domain/telegram/ports";

export class LinkTelegramUseCase {
  constructor(
    private readonly repo: TelegramRepository,
    private readonly sender: TelegramSender,
  ) {}

  async execute(chatId: string): Promise<void> {
    const alreadyThis = await this.repo.findUserByChatId(chatId);
    if (alreadyThis) {
      await this.sender.sendMessage(chatId, "Ya estás vinculado ✅. Para registrar: \"150 tacos\" (gasto) o \"+20000 nómina\" (ingreso).");
      return;
    }

    const existingLinked = await this.repo.findAnyLinkedUser();
    if (existingLinked) {
      await this.sender.sendMessage(chatId, "Esta app ya tiene un chat de Telegram vinculado a otra persona.");
      return;
    }

    const user = await this.repo.findFirstUser();
    if (!user) {
      await this.sender.sendMessage(chatId, "Todavía no hay ningún usuario — corre el bootstrap de la app primero.");
      return;
    }

    await this.repo.linkChatId(user.id, chatId);
    await this.sender.sendMessage(
      chatId,
      `✅ Vinculado como ${user.name}. Para registrar un gasto escribe algo como "150 tacos". Para un ingreso: "+20000 nómina".`,
    );
  }
}
