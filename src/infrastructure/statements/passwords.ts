import type { StatementBank } from "@/domain/statements/types";

export function statementPasswordFor(bank: StatementBank, env: NodeJS.ProcessEnv = process.env): string | undefined {
  const value = env[`STATEMENT_PASSWORD_${bank.toUpperCase()}`];
  return value && value.length > 0 ? value : undefined;
}
