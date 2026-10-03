export interface UserRecord {
  id: number;
  familyId: number;
  email: string;
  name: string;
  passwordHash: string;
}

export type AuthenticatedUser = Omit<UserRecord, "passwordHash">;

export interface NewUserInput {
  familyId: number;
  email: string;
  passwordHash: string;
  name: string;
}

export interface SessionWithUser {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  user: UserRecord;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface SessionTokens {
  generate(): string;
  hash(token: string): Promise<string>;
}

export interface AccessTokenIssuer {
  sign(user: AuthenticatedUser): Promise<string>;
  verify(token: string): Promise<AuthenticatedUser | null>;
}

export interface AuthRepository {
  hasAnyFamily(): Promise<boolean>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  createFamilyWithUser(familyName: string, currency: string, user: Omit<NewUserInput, "familyId">): Promise<UserRecord>;
  createSession(userId: number, tokenHash: string, expiresAt: Date): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionWithUser | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
}
