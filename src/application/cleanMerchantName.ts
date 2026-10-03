import type { MerchantNameCleaner, MerchantPatternRecord, MerchantPatternRepository } from "@/domain/merchants/ports";
import { normalizeMerchantPattern } from "@/domain/merchants/rules";
import type { ProvidersRepository } from "@/domain/providers/ports";
import { normalizeProviderName } from "@/domain/providers/rules";

export class CleanMerchantNameUseCase {
  constructor(
    private readonly repo: MerchantPatternRepository,
    private readonly cleaner: MerchantNameCleaner,
    private readonly providersRepo: ProvidersRepository,
  ) {}

  /**
   * `alreadyClean` evita la llamada a Gemini cuando `rawDescription` no viene de un banco (CSV)
   * sino que el usuario ya la escribió a mano (manual/Telegram) y por tanto ya es un nombre limpio.
   */
  async execute(familyId: number, rawDescription: string, alreadyClean = false): Promise<MerchantPatternRecord> {
    const pattern = normalizeMerchantPattern(rawDescription);

    const existing = await this.repo.findByPattern(familyId, pattern);
    if (existing) return existing;

    const cleanName = alreadyClean ? rawDescription.trim() : await this.cleaner.clean(rawDescription);
    const providerName = normalizeProviderName(cleanName);
    const provider = (await this.providersRepo.findByName(familyId, providerName)) ?? (await this.providersRepo.create(familyId, providerName));
    return this.repo.create(familyId, pattern, cleanName, provider.id);
  }
}
