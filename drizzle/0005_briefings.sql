CREATE TABLE "briefing_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" varchar(20) NOT NULL,
	"type" varchar(20) NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"content" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"title" varchar(255),
	"language" varchar(2) DEFAULT 'es' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"intro" text,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"answer_notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"internal_notes" text,
	"started_at" timestamp,
	"submitted_at" timestamp,
	"share_token" varchar(64),
	"share_pin" varchar(12),
	"share_enabled" boolean DEFAULT false NOT NULL,
	"share_failed_attempts" integer DEFAULT 0 NOT NULL,
	"share_locked_until" timestamp,
	"share_view_count" integer DEFAULT 0 NOT NULL,
	"share_last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "briefings_code_unique" UNIQUE("code"),
	CONSTRAINT "briefings_share_token_unique" UNIQUE("share_token")
);
