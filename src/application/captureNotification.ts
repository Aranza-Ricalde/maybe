import type { NotificationExtractor } from "@/domain/captures/ports";
import { parseBankNotification } from "@/domain/captures/notification";
import { InvalidCaptureError, MAX_CAPTURE_DESCRIPTION_LENGTH, MAX_CAPTURE_NOTES_LENGTH } from "@/domain/captures/rules";
import { assertValidIsoDate } from "@/domain/ledger/rules";
import { pesosToCents } from "@/domain/shared/money";
import { logFailure } from "@/lib/log";
import { todayIso } from "@/lib/today";
import type { CaptureMovementInput, CaptureMovementResult, CaptureMovementUseCase } from "./captureMovement";

export class UnreadableNotificationError extends InvalidCaptureError {}

export class CaptureNotificationUseCase {
  constructor(
    private readonly capture: CaptureMovementUseCase,
    private readonly extractor?: NotificationExtractor,
  ) {}

  async execute(familyId: number, account: CaptureMovementInput["account"], text: string, source?: CaptureMovementInput["source"]): Promise<CaptureMovementResult> {
    const parsed = parseBankNotification(text, todayIso()) ?? (await this.extractWithAi(text));
    if (!parsed) throw new UnreadableNotificationError("No pude entender la notificación.");
    return this.capture.execute({ familyId, account, source, ...parsed, description: parsed.description.slice(0, MAX_CAPTURE_DESCRIPTION_LENGTH), notes: text.slice(0, MAX_CAPTURE_NOTES_LENGTH) });
  }

  private async extractWithAi(text: string) {
    if (!this.extractor) return null;
    try {
      const found = await this.extractor.extract(text);
      if (!found || !(found.amount > 0) || !found.description.trim()) return null;
      if (found.date) assertValidIsoDate(found.date);
      return { type: found.type, amountCents: pesosToCents(found.amount), description: found.description.trim(), ...(found.date ? { date: found.date } : {}) };
    } catch (error) {
      logFailure("extracción con IA falló", error);
      return null;
    }
  }
}
