import type { AccessTokenIssuer, AuthRepository, SessionTokens } from "@/domain/auth/ports";
import { isExpired } from "@/domain/auth/rules";

export interface RefreshAccessTokenResult {
  accessToken: string;
}

export class RefreshAccessTokenUseCase {
  constructor(
    private readonly repo: AuthRepository,
    private readonly tokens: SessionTokens,
    private readonly accessTokens: AccessTokenIssuer,
  ) {}

  async execute(rawRefreshToken: string | undefined): Promise<RefreshAccessTokenResult | null> {
    if (!rawRefreshToken) return null;

    const tokenHash = await this.tokens.hash(rawRefreshToken);
    const session = await this.repo.findSessionByTokenHash(tokenHash);
    if (!session) return null;

    if (isExpired(session.expiresAt)) {
      await this.repo.deleteSessionByTokenHash(session.tokenHash);
      return null;
    }

    const accessToken = await this.accessTokens.sign(session.user);
    return { accessToken };
  }
}
