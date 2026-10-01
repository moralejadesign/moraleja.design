ALTER TABLE "projects" ADD COLUMN "background" varchar(32);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "category" varchar(255);