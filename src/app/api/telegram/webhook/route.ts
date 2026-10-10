import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseLinkCommand } from "@/domain/telegram/rules";
import { parseTelegramUpdate } from "@/domain/telegram/update";
import { handleTelegramMessageUseCase, linkTelegramUseCase, processedTelegramUpdates } from "@/infrastructure/container";

function isValidWebhookSecret(request: NextRequest): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;

  const received = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isValidWebhookSecret(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = parseTelegramUpdate(await readJson(request));
  if (!update) return NextResponse.json({ ok: true });
  if (update.updateId != null && !(await processedTelegramUpdates.markIfNew(update.updateId))) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (update.kind === "callback") {
      await handleTelegramMessageUseCase.handleCallback(update.chatId, update.callbackId, update.messageId, update.data);
    } else {
      const link = parseLinkCommand(update.text);
      if (link) await linkTelegramUseCase.execute(update.chatId, link.code);
      else await handleTelegramMessageUseCase.execute(update.chatId, update.text);
    }
  } catch (err) {
    console.error("Error procesando update de Telegram:", err instanceof Error ? err.message : "desconocido");
  }

  return NextResponse.json({ ok: true });
}
