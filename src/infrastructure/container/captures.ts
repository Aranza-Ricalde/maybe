import { AuthenticateApiTokenUseCase, DescribeApiTokenUseCase, IssueApiTokenUseCase } from "@/application/apiToken";
import { CaptureMovementUseCase } from "@/application/captureMovement";
import { CorrectCaptureUseCase } from "@/application/correctCapture";
import { HandleTelegramMessageUseCase } from "@/application/handleTelegramMessage";
import { AnswerTelegramQueryUseCase } from "@/application/answerTelegramQuery";
import { ConfirmCaptureUseCase } from "@/application/confirmCapture";
import { DrizzleApiTokenRepository } from "../db/apiTokens";
import { DrizzleCaptureRepository } from "../db/captures";
import { db } from "../db/client";
import { DrizzleLedgerUnitOfWork } from "../db/ledger";
import { CaptureNotificationUseCase } from "@/application/captureNotification";
import { GeminiNotificationExtractor } from "../gemini/notificationExtractor";
import { GeminiCategoryClassifier } from "../gemini/categoryClassifier";
import { Sha256ApiTokenCodec } from "../security/apiTokenCodec";
import { accountsReader, categoriesReader, transactionsReader } from "./readers";
import { dashboardRepo, deleteTransactionUseCase, resolvePeriodContextUseCase, recordTransactionUseCase, telegramRepo, telegramSender, resolveTransactionConceptUseCase, updateTransactionUseCase } from "./core";

const geminiAvailable = Boolean(process.env.GEMINI_API_KEY);
const apiTokenRepo = new DrizzleApiTokenRepository();
const apiTokenCodec = new Sha256ApiTokenCodec();
export const issueApiTokenUseCase = new IssueApiTokenUseCase(apiTokenRepo, apiTokenCodec);
export const authenticateApiTokenUseCase = new AuthenticateApiTokenUseCase(apiTokenRepo, apiTokenCodec);
export const describeApiTokenUseCase = new DescribeApiTokenUseCase(apiTokenRepo);
export const captureRepo = new DrizzleCaptureRepository();
export const captureMovementUseCase = new CaptureMovementUseCase(
  recordTransactionUseCase,
  updateTransactionUseCase,
  captureRepo,
  categoriesReader,
  resolveTransactionConceptUseCase,
  geminiAvailable ? new GeminiCategoryClassifier() : undefined,
);
export const captureNotificationUseCase = new CaptureNotificationUseCase(captureMovementUseCase, geminiAvailable ? new GeminiNotificationExtractor() : undefined);
export const confirmCaptureUseCase = new ConfirmCaptureUseCase(captureRepo, new DrizzleLedgerUnitOfWork(db), updateTransactionUseCase);

const correctCaptureUseCase = new CorrectCaptureUseCase(captureRepo, categoriesReader, new DrizzleLedgerUnitOfWork(db), updateTransactionUseCase, deleteTransactionUseCase);
export const handleTelegramMessageUseCase = new HandleTelegramMessageUseCase(telegramRepo, captureMovementUseCase, captureNotificationUseCase, correctCaptureUseCase, new AnswerTelegramQueryUseCase(accountsReader, transactionsReader, categoriesReader, resolvePeriodContextUseCase, dashboardRepo), telegramSender);
