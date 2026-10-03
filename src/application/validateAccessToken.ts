import type { AccessTokenIssuer, AuthenticatedUser } from "@/domain/auth/ports";

export class ValidateAccessTokenUseCase {
  constructor(private readonly accessTokens: AccessTokenIssuer) {}

  async execute(rawAccessToken: string | undefined): Promise<AuthenticatedUser | null> {
    if (!rawAccessToken) return null;
    return this.accessTokens.verify(rawAccessToken);
  }
}
