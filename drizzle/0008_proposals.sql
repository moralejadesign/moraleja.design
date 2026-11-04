CREATE TABLE "proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"title" varchar(255),
	"language" varchar(2) DEFAULT 'es' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"intro" text,
	"current_version_id" integer,
	"show_past_rounds" boolean DEFAULT false NOT NULL,
	"internal_notes" text,
	"share_token" varchar(64),
	"share_pin" varchar(12),
	"share_enabled" boolean DEFAULT false NOT NULL,
	"share_failed_attempts" integer DEFAULT 0 NOT NULL,
	"share_locked_until" timestamp,
	"share_view_count" integer DEFAULT 0 NOT NULL,
	"share_last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "proposals_code_unique" UNIQUE("code"),
	CONSTRAINT "proposals_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "proposal_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL REFERENCES "proposals"("id") ON DELETE cascade,
	"number" integer NOT NULL,
	"note" text,
	"slides" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reactions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"decision" varchar(20),
	"decision_note" text,
	"decided_by" varchar(80),
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proposal_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL REFERENCES "proposal_versions"("id") ON DELETE cascade,
	"slide_id" varchar(32) NOT NULL,
	"parent_id" integer,
	"author_name" varchar(80) NOT NULL,
	"author_key" varchar(64),
	"is_admin" boolean DEFAULT false NOT NULL,
	"body" text NOT NULL,
	"x" real,
	"y" real,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "proposal_versions_proposal_idx" ON "proposal_versions" ("proposal_id");
--> statement-breakpoint
CREATE INDEX "proposal_comments_version_idx" ON "proposal_comments" ("version_id");
