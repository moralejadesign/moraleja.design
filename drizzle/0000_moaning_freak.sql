CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"type" varchar(10) NOT NULL,
	"filename" varchar(255),
	"title" varchar(255),
	"description" text,
	"alt_text" varchar(255),
	"tags" text[],
	"keywords" text,
	"project_id" integer,
	"show_in_gallery" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "assets_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "lab_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"thumbnail" text NOT NULL,
	"external_url" text NOT NULL,
	"tool" varchar(100) NOT NULL,
	"category" varchar(20) NOT NULL,
	"tags" text[],
	"is_published" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lab_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"label" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"width" integer,
	"height" integer,
	"file_size" varchar(50),
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" text,
	"thumbnail" text NOT NULL,
	"price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"thumbnail" text NOT NULL,
	"height_ratio" real DEFAULT 1.5 NOT NULL,
	"text_contrast" varchar(10) DEFAULT 'light',
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;