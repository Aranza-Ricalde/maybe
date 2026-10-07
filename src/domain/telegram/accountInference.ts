import { normalizeDescriptionTokens } from "@/domain/merchants/resolver";
import { WEAK_ACCOUNT_WORDS } from "@/domain/transfers/descriptionMarkers";
import type { ResolvedAccount } from "./ports";

const MIN_TOKEN_LENGTH = 2;

function distinctiveTokens(accountName: string): string[] {
  return normalizeDescriptionTokens(accountName).filter((token) => token.length >= MIN_TOKEN_LENGTH && !WEAK_ACCOUNT_WORDS.has(token.toLowerCase()));
}

export function inferAccountFromText(text: string, accounts: ResolvedAccount[]): ResolvedAccount | null {
  const words = new Set(normalizeDescriptionTokens(text));
  const matches = accounts.filter((account) => {
    const tokens = distinctiveTokens(account.name);
    return tokens.length > 0 && tokens.every((token) => words.has(token));
  });
  return matches.length === 1 ? matches[0] : null;
}
