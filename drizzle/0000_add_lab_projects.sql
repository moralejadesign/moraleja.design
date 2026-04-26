CREATE TABLE IF NOT EXISTS "lab_projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" varchar(255) NOT NULL UNIQUE,
  "title" varchar(255) NOT NULL,
  "description" text,
  "thumbnail" text NOT NULL,
  "external_url" text NOT NULL,
  "tool" varchar(100) NOT NULL,
  "category" varchar(20) NOT NULL,
  "tags" text[],
  "is_published" boolean NOT NULL DEFAULT false,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
