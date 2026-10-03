import type { AuthRepository, PasswordHasher, UserRecord } from "@/domain/auth/ports";
import { InvalidCredentialsInputError, assertValidEmail, assertValidPassword } from "@/domain/auth/rules";

export class FamilyAlreadyExistsError extends Error {
  constructor() {
    super("Ya existe una family — esta app es de un solo hogar, no un signup público. Usa LoginUseCase.");
  }
}

export interface BootstrapFamilyInput {
  familyName: string;
  currency: string;
  email: string;
  password: string;
  name: string;
}

export class BootstrapFamilyUseCase {
  constructor(
    private readonly repo: AuthRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: BootstrapFamilyInput): Promise<UserRecord> {
    if (await this.repo.hasAnyFamily()) {
      throw new FamilyAlreadyExistsError();
    }
    assertValidEmail(input.email);
    assertValidPassword(input.password);
    if (!input.name.trim()) {
      throw new InvalidCredentialsInputError("name no puede estar vacío");
    }

    const passwordHash = await this.hasher.hash(input.password);
    return this.repo.createFamilyWithUser(input.familyName, input.currency, {
      email: input.email,
      passwordHash,
      name: input.name,
    });
  }
}
