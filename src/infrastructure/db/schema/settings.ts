import { bigint, pgTable, text } from "drizzle-orm/pg-core";
import { families } from "./core";
import { updatedAtColumn } from "./columns";

export const familySettings = pgTable("family_settings", {
  familyId: bigint("family_id", { mode: "number" })
    .primaryKey()
    .references(() => families.id, { onDelete: "cascade" }),
  minimumBalanceCents: bigint("minimum_balance_cents", { mode: "number" }),
  periodView: text("period_view"),
  updatedAt: updatedAtColumn(),
});
