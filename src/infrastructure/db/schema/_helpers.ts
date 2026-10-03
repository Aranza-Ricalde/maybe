import { sql } from "drizzle-orm";
import { check, type PgColumn } from "drizzle-orm/pg-core";

export function checkEnum(constraintName: string, column: PgColumn, values: readonly string[]) {
  return check(constraintName, sql`${column} IN (${sql.raw(values.map((v) => `'${v}'`).join(", "))})`);
}
