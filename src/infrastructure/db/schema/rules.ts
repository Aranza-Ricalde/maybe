import { bigint, bigserial, boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { families } from "./core";

export type RuleCondition = { field: string; operator: string; value: unknown };
export type RuleAction = { type: string; value: unknown };

export const rules = pgTable("rules", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  familyId: bigint("family_id", { mode: "number" })
    .notNull()
    .references(() => families.id, { onDelete: "restrict" }),
  name: text("name"),
  conditions: jsonb("conditions").notNull().$type<RuleCondition[]>(),
  actions: jsonb("actions").notNull().$type<RuleAction[]>(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
