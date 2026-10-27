CREATE TABLE "billing_profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"full_name" varchar(255) DEFAULT '' NOT NULL,
	"id_number" varchar(64) DEFAULT '' NOT NULL,
	"city" varchar(120) DEFAULT '' NOT NULL,
	"payment_details" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "charge_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"budget_id" integer,
	"client_name" varchar(255) NOT NULL,
	"client_tax_id" varchar(64),
	"language" varchar(2) DEFAULT 'es' NOT NULL,
	"currency" varchar(3) DEFAULT 'COP' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"city" varchar(120),
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payment_details" text,
	"notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"paid_at" date,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "charge_accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "charge_accounts" ADD CONSTRAINT "charge_accounts_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE set null ON UPDATE no action;