import type { AccountType } from "./rules";

export interface AccountRecord {
  id: number;
  familyId: number;
  name: string;
  type: AccountType;
  details: Record<string, unknown> | null;
  isActive: boolean;
}

export interface NewAccountInput {
  familyId: number;
  name: string;
  type: AccountType;
  creditLimitCents?: number;
}

export interface UpdateAccountInput {
  id: number;
  name: string;
  type: AccountType;
  creditLimitCents?: number;
}

export interface AccountsRepository {
  getById(id: number): Promise<AccountRecord | null>;
  getActivityCount(id: number): Promise<number>;
  create(input: NewAccountInput): Promise<void>;
  update(id: number, fields: { name: string; type: AccountType; details: Record<string, unknown> | null }): Promise<void>;
  archive(id: number): Promise<void>;
  delete(id: number): Promise<void>;
  restore(id: number): Promise<void>;
}
