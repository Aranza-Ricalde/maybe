import type { MerchantNameCleaner, MerchantPatternRecord, MerchantPatternRepository } from "@/domain/merchants/ports";
import { learnNoiseTokens, merchantKey, resolveMerchant } from "@/domain/merchants/resolver";
import { legacyMerchantPattern, normalizeMerchantPattern, sanitizeCleanName } from "@/domain/merchants/rules";
import type { ProvidersRepository } from "@/domain/providers/ports";
import { normalizeProviderName } from "@/domain/providers/rules";

const UNIDENTIFIED_MERCHANT = "Sin identificar";

export class CleanMerchantNameUseCase {
  constructor(
    private readonly repo: MerchantPatternRepository,
    private readonly providersRepo: ProvidersRepository,
    private readonly aiFallback?: MerchantNameCleaner,
  ) {}

  async peekProviderId(familyId: number, rawDescription: string): Promise<number | null> {
    const cached = await this.findCached(familyId, rawDescription);
    if (cached) return cached.providerId;
    const [providers, history] = await Promise.all([this.providersRepo.listForFamily(familyId), this.repo.listHistory(familyId)]);
    const resolved = resolveMerchant(rawDescription, { knownMerchants: providers.map((p) => p.name), noiseTokens: learnNoiseTokens(history) });
    if (!resolved) return null;
    const key = merchantKey(normalizeProviderName(resolved.name));
    return providers.find((p) => merchantKey(p.name) === key)?.id ?? null;
  }

  private async findCached(familyId: number, rawDescription: string): Promise<MerchantPatternRecord | null> {
    const pattern = normalizeMerchantPattern(rawDescription);
    const existing = await this.repo.findByPattern(familyId, pattern);
    if (existing) return existing;
    const legacy = legacyMerchantPattern(rawDescription);
    return legacy !== pattern ? this.repo.findByPattern(familyId, legacy) : null;
  }

  async execute(familyId: number, rawDescription: string): Promise<MerchantPatternRecord> {
    const pattern = normalizeMerchantPattern(rawDescription);

    const cached = await this.findCached(familyId, rawDescription);
    if (cached) return cached;

    const [providers, history] = await Promise.all([this.providersRepo.listForFamily(familyId), this.repo.listHistory(familyId)]);
    const resolved = resolveMerchant(rawDescription, {
      knownMerchants: providers.map((p) => p.name),
      noiseTokens: learnNoiseTokens(history),
    });

    const cleanName = resolved?.name ?? (await this.fallbackName(rawDescription));
    const providerName = normalizeProviderName(cleanName);
    const provider =
      providers.find((p) => merchantKey(p.name) === merchantKey(providerName)) ?? (await this.providersRepo.create(familyId, providerName));
    return this.repo.create(familyId, pattern, cleanName, provider.id);
  }

  private async fallbackName(rawDescription: string): Promise<string> {
    if (!this.aiFallback || !rawDescription.trim()) return UNIDENTIFIED_MERCHANT;
    return sanitizeCleanName(await this.aiFallback.clean(rawDescription));
  }
}
