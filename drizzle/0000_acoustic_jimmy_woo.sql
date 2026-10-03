CREATE TABLE "families" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"telegram_chat_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "account_balances_daily" (
	"account_id" bigint NOT NULL,
	"date" date NOT NULL,
	"balance_cents" bigint NOT NULL,
	CONSTRAINT "account_balances_daily_account_id_date_pk" PRIMARY KEY("account_id","date")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"classification" text GENERATED ALWAYS AS (CASE WHEN type IN ('credit_card', 'loan', 'other_liability') THEN 'liability' ELSE 'asset' END) STORED NOT NULL,
	"details" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_type_check" CHECK ("accounts"."type" IN ('checking', 'savings', 'credit_card', 'cash', 'loan', 'property', 'vehicle', 'other_asset', 'other_liability'))
);
--> statement-breakpoint
CREATE TABLE "rejected_transfers" (
	"inflow_transaction_id" bigint NOT NULL,
	"outflow_transaction_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_tags" (
	"transaction_id" bigint NOT NULL,
	"tag_id" bigint NOT NULL,
	CONSTRAINT "transaction_tags_transaction_id_tag_id_pk" PRIMARY KEY("transaction_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"account_id" bigint NOT NULL,
	"date" date NOT NULL,
	"amount_cents" bigint NOT NULL,
	"name" text NOT NULL,
	"raw_description" text,
	"merchant_id" bigint,
	"category_id" bigint,
	"notes" text,
	"kind" text DEFAULT 'standard' NOT NULL,
	"status" text DEFAULT 'posted' NOT NULL,
	"source" text NOT NULL,
	"import_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_kind_check" CHECK ("transactions"."kind" IN ('standard', 'transfer', 'loan_payment', 'cc_payment', 'adjustment')),
	CONSTRAINT "transactions_status_check" CHECK ("transactions"."status" IN ('posted', 'pending')),
	CONSTRAINT "transactions_source_check" CHECK ("transactions"."source" IN ('manual', 'csv_import', 'telegram'))
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"inflow_transaction_id" bigint NOT NULL,
	"outflow_transaction_id" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "transfers_inflow_transaction_id_unique" UNIQUE("inflow_transaction_id"),
	CONSTRAINT "transfers_outflow_transaction_id_unique" UNIQUE("outflow_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "valuations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"account_id" bigint NOT NULL,
	"date" date NOT NULL,
	"balance_cents" bigint NOT NULL,
	"source" text NOT NULL,
	CONSTRAINT "valuations_source_check" CHECK ("valuations"."source" IN ('manual', 'csv_import'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"parent_id" bigint,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"icon" text NOT NULL,
	"classification" text NOT NULL,
	CONSTRAINT "categories_classification_check" CHECK ("categories"."classification" IN ('income', 'expense'))
);
--> statement-breakpoint
CREATE TABLE "merchant_patterns" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"raw_pattern" text NOT NULL,
	"clean_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"name" text,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_categories" (
	"budget_id" bigint NOT NULL,
	"category_id" bigint NOT NULL,
	"budgeted_amount_cents" bigint NOT NULL,
	CONSTRAINT "budget_categories_budget_id_category_id_pk" PRIMARY KEY("budget_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"month" date NOT NULL,
	"expected_income_cents" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_candidates" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"pattern_signature" text NOT NULL,
	"suggested_amount_cents" bigint NOT NULL,
	"suggested_category_id" bigint,
	"status" text DEFAULT 'pending' NOT NULL,
	"accepted_recurring_item_id" bigint,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_candidates_status_check" CHECK ("recurring_candidates"."status" IN ('pending', 'accepted', 'dismissed'))
);
--> statement-breakpoint
CREATE TABLE "recurring_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"name" text NOT NULL,
	"flow" text NOT NULL,
	"estimated_amount_cents" bigint NOT NULL,
	"category_id" bigint,
	"day_of_month" integer NOT NULL,
	"account_id" bigint,
	"auto_detected" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_items_flow_check" CHECK ("recurring_items"."flow" IN ('income', 'expense')),
	CONSTRAINT "recurring_items_status_check" CHECK ("recurring_items"."status" IN ('active', 'paused'))
);
--> statement-breakpoint
CREATE TABLE "scheduled_transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"name" text NOT NULL,
	"amount_cents" bigint NOT NULL,
	"category_id" bigint,
	"account_id" bigint,
	"scheduled_date" date NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"confirmed_transaction_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scheduled_transactions_status_check" CHECK ("scheduled_transactions"."status" IN ('planned', 'confirmed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"name" text NOT NULL,
	"target_amount_cents" bigint NOT NULL,
	"target_date" date,
	"account_id" bigint,
	"monthly_contribution_cents" bigint,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_monthly_totals" (
	"family_id" bigint NOT NULL,
	"category_id" bigint NOT NULL,
	"month" date NOT NULL,
	"total_cents" bigint NOT NULL,
	CONSTRAINT "category_monthly_totals_family_id_category_id_month_pk" PRIMARY KEY("family_id","category_id","month")
);
--> statement-breakpoint
CREATE TABLE "income_expense_monthly" (
	"family_id" bigint NOT NULL,
	"month" date NOT NULL,
	"income_cents" bigint NOT NULL,
	"expense_cents" bigint NOT NULL,
	CONSTRAINT "income_expense_monthly_family_id_month_pk" PRIMARY KEY("family_id","month")
);
--> statement-breakpoint
CREATE TABLE "import_mappings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"bank_signature" text NOT NULL,
	"column_mapping" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"filename" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "imports_status_check" CHECK ("imports"."status" IN ('pending', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"family_id" bigint NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_balances_daily" ADD CONSTRAINT "account_balances_daily_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rejected_transfers" ADD CONSTRAINT "rejected_transfers_inflow_transaction_id_transactions_id_fk" FOREIGN KEY ("inflow_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rejected_transfers" ADD CONSTRAINT "rejected_transfers_outflow_transaction_id_transactions_id_fk" FOREIGN KEY ("outflow_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchant_patterns_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_patterns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_id_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_inflow_transaction_id_transactions_id_fk" FOREIGN KEY ("inflow_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_outflow_transaction_id_transactions_id_fk" FOREIGN KEY ("outflow_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_patterns" ADD CONSTRAINT "merchant_patterns_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_candidates" ADD CONSTRAINT "recurring_candidates_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_candidates" ADD CONSTRAINT "recurring_candidates_suggested_category_id_categories_id_fk" FOREIGN KEY ("suggested_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_candidates" ADD CONSTRAINT "recurring_candidates_accepted_recurring_item_id_recurring_items_id_fk" FOREIGN KEY ("accepted_recurring_item_id") REFERENCES "public"."recurring_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_items" ADD CONSTRAINT "recurring_items_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_items" ADD CONSTRAINT "recurring_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_items" ADD CONSTRAINT "recurring_items_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_confirmed_transaction_id_transactions_id_fk" FOREIGN KEY ("confirmed_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_monthly_totals" ADD CONSTRAINT "category_monthly_totals_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_monthly_totals" ADD CONSTRAINT "category_monthly_totals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_expense_monthly" ADD CONSTRAINT "income_expense_monthly_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_mappings" ADD CONSTRAINT "import_mappings_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_account_date_idx" ON "transactions" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "transactions_category_date_idx" ON "transactions" USING btree ("category_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "valuations_account_date_unique" ON "valuations" USING btree ("account_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_patterns_family_pattern_unique" ON "merchant_patterns" USING btree ("family_id","raw_pattern");--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_family_month_unique" ON "budgets" USING btree ("family_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "import_mappings_family_bank_unique" ON "import_mappings" USING btree ("family_id","bank_signature");