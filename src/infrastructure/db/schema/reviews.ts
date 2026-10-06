import { bigint, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { ReviewDecision, ReviewTopic } from "@/domain/transfers/rules";
import { families } from "./core";
import { transactions } from "./transactions";
import { idColumn } from "./columns";

export const transactionReviews = pgTable(
  "transaction_reviews",
  {
    id: idColumn(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    transactionId: bigint("transaction_id", { mode: "number" })
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    topic: text("topic").notNull().$type<ReviewTopic>(),
    decision: text("decision").notNull().$type<ReviewDecision>(),
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("transaction_reviews_transaction_topic_unique").on(table.transactionId, table.topic)],
);
