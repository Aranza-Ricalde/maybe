import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LINK_COMMANDS } from "@/domain/telegram/rules";
import { handleTelegramMessageUseCase, linkTelegramUseCase } from "@/infrastructure/container";

interface TelegramUpdate {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
}

function isValidWebhookSecret(request: NextRequest): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;

  const received = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isValidWebhookSecret(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const text = update.message?.text;

  if (chatId == null || !text) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (LINK_COMMANDS.includes(text.trim())) {
      await linkTelegramUseCase.execute(String(chatId));
    } else {
      await handleTelegramMessageUseCase.execute(String(chatId), text);
    }
  } catch (err) {
    console.error("Error procesando update de Telegram:", err);
  }

  return NextResponse.json({ ok: true });
}
