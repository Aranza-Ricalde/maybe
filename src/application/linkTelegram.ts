import type { TelegramLinkCodes, TelegramRepository, TelegramSender } from "@/domain/telegram/ports";

export class LinkTelegramUseCase {
  constructor(
    private readonly repo: TelegramRepository,
    private readonly sender: TelegramSender,
    private readonly linkCodes: TelegramLinkCodes,
  ) {}

  async execute(chatId: string, code: string | null = null): Promise<void> {
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

    if (!this.linkCodes.matches(user.id, code)) {
      await this.sender.sendMessage(chatId, "Para vincular escribe /link seguido del código que aparece en Configuración dentro de la app. Ejemplo: /link ABC123DEF4");
      return;
    }

    await this.repo.linkChatId(user.id, chatId);
    await this.sender.sendMessage(
      chatId,
      `✅ Vinculado como ${user.name}. Para registrar un gasto escribe algo como "150 tacos". Para un ingreso: "+20000 nómina".`,
    );
  }
}
