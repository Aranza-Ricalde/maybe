import type { Flow } from "@/domain/ledger/rules";

export const CAPTURE_API_ROUTE = "/api/movements";
export const API_TOKEN_PREFIX = "mv_";
export const API_TOKEN_BYTES = 32;
export const MAX_CAPTURE_DESCRIPTION_LENGTH = 200;
export const MAX_CAPTURE_NOTES_LENGTH = 500;
export const MAX_CAPTURE_MESSAGE_LENGTH = 2000;

export const CAPTURE_REVIEW = { topic: "capture_confirmation", pending: "pending_confirmation", confirmed: "confirmed" } as const;

export const CAPTURE_SOURCES = ["api", "telegram"] as const;
export type CaptureSource = (typeof CAPTURE_SOURCES)[number];
export const TOP_CATEGORIES_WINDOW_DAYS = 180;

export const CAPTURE_TYPES = ["expense", "income"] as const satisfies readonly Flow[];
export type CaptureType = (typeof CAPTURE_TYPES)[number];

export const CATEGORY_GUESS_CONFIDENCES = ["high", "medium", "low"] as const;
export type CategoryGuessConfidence = (typeof CATEGORY_GUESS_CONFIDENCES)[number];

export class InvalidCaptureError extends Error {}
export class CaptureAccountNotFoundError extends InvalidCaptureError {}
export class CaptureAccountAmbiguousError extends InvalidCaptureError {}

export const signedAmountCents = (type: CaptureType, absoluteCents: number) => (type === "expense" ? -absoluteCents : absoluteCents);

export const isApplicableGuess = (confidence: CategoryGuessConfidence) => confidence === "high" || confidence === "medium";

export const guessNeedsConfirmation = (confidence: CategoryGuessConfidence) => confidence !== "high";

export function normalizeAccountName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function looksLikeApiToken(candidate: string): boolean {
  return candidate.startsWith(API_TOKEN_PREFIX) && candidate.length > API_TOKEN_PREFIX.length + 20;
}
