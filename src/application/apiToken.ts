import type { ApiTokenCodec, ApiTokenInfo, ApiTokenRepository } from "@/domain/captures/ports";
import { looksLikeApiToken } from "@/domain/captures/rules";

export class IssueApiTokenUseCase {
  constructor(
    private readonly repo: ApiTokenRepository,
    private readonly codec: ApiTokenCodec,
  ) {}

  async execute(familyId: number): Promise<string> {
    const { token, tokenHash, lastFour } = this.codec.generate();
    await this.repo.replaceToken(familyId, tokenHash, lastFour);
    return token;
  }
}

export class AuthenticateApiTokenUseCase {
  constructor(
    private readonly repo: ApiTokenRepository,
    private readonly codec: ApiTokenCodec,
  ) {}

  async execute(token: string): Promise<number | null> {
    if (!looksLikeApiToken(token)) return null;
    const tokenHash = this.codec.hash(token);
    const familyId = await this.repo.findFamilyByHash(tokenHash);
    if (familyId == null) return null;
    await this.repo.markUsed(tokenHash);
    return familyId;
  }
}

export class DescribeApiTokenUseCase {
  constructor(private readonly repo: ApiTokenRepository) {}

  execute(familyId: number): Promise<ApiTokenInfo | null> {
    return this.repo.describe(familyId);
  }
}
