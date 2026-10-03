import type { AccessTokenIssuer, AuthRepository, PasswordHasher, SessionTokens } from "@/domain/auth/ports";
import { refreshTokenExpiry } from "@/domain/auth/rules";

export class InvalidLoginError extends Error {
  constructor() {
    super("email o contraseña incorrectos");
  }
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export class LoginUseCase {
  constructor(
    private readonly repo: AuthRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: SessionTokens,
    private readonly accessTokens: AccessTokenIssuer,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.repo.findUserByEmail(email);
    if (!user || !(await this.hasher.verify(password, user.passwordHash))) {
      throw new InvalidLoginError();
    }

    const refreshToken = this.tokens.generate();
    const refreshExpiresAt = refreshTokenExpiry();
    await this.repo.createSession(user.id, await this.tokens.hash(refreshToken), refreshExpiresAt);

    const accessToken = await this.accessTokens.sign(user);

    return { accessToken, refreshToken, refreshExpiresAt };
  }
}
