import { boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { idColumn, familyIdColumn, createdAtColumn, updatedAtColumn } from "./columns";

export type RuleCondition = { field: string; operator: string; value: unknown };
export type RuleAction = { type: string; value: unknown };

export const rules = pgTable("rules", {
  id: idColumn(),
  familyId: familyIdColumn(),
  name: text("name"),
  conditions: jsonb("conditions").notNull().$type<RuleCondition[]>(),
  actions: jsonb("actions").notNull().$type<RuleAction[]>(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});
