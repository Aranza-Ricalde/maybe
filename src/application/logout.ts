import type { AuthRepository, SessionTokens } from "@/domain/auth/ports";

export class LogoutUseCase {
  constructor(
    private readonly repo: AuthRepository,
    private readonly tokens: SessionTokens,
  ) {}

  async execute(rawToken: string): Promise<void> {
    await this.repo.deleteSessionByTokenHash(await this.tokens.hash(rawToken));
  }
}
