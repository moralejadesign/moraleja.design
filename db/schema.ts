import { pgTable, serial, varchar, text, real, timestamp, jsonb, integer, boolean, decimal, date } from "drizzle-orm/pg-core";

// Block types with assetId support (url kept as fallback for backwards compatibility)
export type BlockType = 
  | { type: "full-image"; assetId?: number; url: string; alt?: string }
  | { type: "two-column"; leftAssetId?: number; rightAssetId?: number; left: string; right: string }
  | { type: "image-text"; assetId?: number; image: string; text: string; imagePosition: "left" | "right"; ratio: "50-50" | "60-40" | "40-60" | "70-30" | "30-70" }
  | { type: "video"; assetId?: number; url: string; autoplay?: boolean; muted?: boolean; aspectRatio?: "16:9" | "4:3" | "1:1" | "9:16" | "4:5" | "auto"; size?: "s" | "m" | "l" }
  | { type: "video-row"; videos: { assetId?: number; url: string; muted?: boolean }[]; columns: 2 | 3; aspectRatio?: "16:9" | "4:3" | "1:1" | "9:16" | "4:5"; autoplay?: boolean }
  | { type: "text"; content: string }
  | { type: "heading"; content: string; level: 1 | 2 | 3 }
  | { type: "quote"; content: string; author?: string };

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  thumbnail: text("thumbnail").notNull(),
  heightRatio: real("height_ratio").notNull().default(1.5),
  textContrast: varchar("text_contrast", { length: 10 }).default("light"),
  blocks: jsonb("blocks").$type<BlockType[]>().notNull().default([]),
  tools: text("tools").array(),
  // Case-study card on the home page
  background: varchar("background", { length: 32 }),
  tagline: text("tagline"),
  category: varchar("category", { length: 255 }),
  // Plays in the home showreel; clicking it opens this project
  showreelVideo: text("showreel_video"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  type: varchar("type", { length: 10 }).notNull(), // "image" | "video"
  filename: varchar("filename", { length: 255 }),
  
  // SEO/Search metadata
  title: varchar("title", { length: 255 }),
  description: text("description"),
  altText: varchar("alt_text", { length: 255 }),
  tags: text("tags").array(),
  keywords: text("keywords"),
  
  // Project link
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  
  // Gallery visibility
  showInGallery: boolean("show_in_gallery").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

// Product types for shop
export type ProductType = "wallpaper" | "print" | "poster";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().$type<ProductType>(),
  description: text("description"),
  thumbnail: text("thumbnail").notNull(),
  
  // Pricing (ready for future payments)
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isFree: boolean("is_free").notNull().default(true),
  
  // Publishing
  isPublished: boolean("is_published").notNull().default(false),
  position: integer("position").notNull().default(0),
  
  // SEO metadata
  tags: text("tags").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  label: varchar("label", { length: 100 }).notNull(), // e.g., "4K Desktop", "Mobile", "Print-Ready PDF"
  url: text("url").notNull(),
  
  // Dimensions for display
  width: integer("width"),
  height: integer("height"),
  fileSize: varchar("file_size", { length: 50 }), // e.g., "12.5 MB"
  
  // Analytics
  downloadCount: integer("download_count").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

// Lab project tools and categories
export type LabTool = "v0" | "Cursor" | "Claude Code" | "Midjourney" | "Higgsfield" | "Image 2.0" | "Nano Banana";
export type LabCategory = "code" | "creative";

export const labProjects = pgTable("lab_projects", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnail: text("thumbnail").notNull(),
  externalUrl: text("external_url").notNull(),
  tool: varchar("tool", { length: 100 }).notNull().$type<LabTool>(),
  category: varchar("category", { length: 20 }).notNull().$type<LabCategory>(),
  tags: text("tags").array(),
  isPublished: boolean("is_published").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type LabProject = typeof labProjects.$inferSelect;
export type NewLabProject = typeof labProjects.$inferInsert;

// Budgets (private, admin-only)
export type BudgetLanguage = "es" | "en";
export type BudgetCurrency = "USD" | "COP";
export type BudgetKind = "project" | "retainer";
export type BudgetStatus = "draft" | "sent" | "approved" | "rejected";

export type BudgetSection = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  deliverable: string;
  includes: string;
  duration: string;
  price: number | null;
};

// Phase content in one language; a library phase stores both
export type BudgetPhaseContent = Omit<BudgetSection, "id" | "price">;

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(), // e.g. "MOR-2026-014"
  clientName: varchar("client_name", { length: 255 }).notNull(),
  // Heading override; defaults to "{CLIENT} BUDGET"
  title: varchar("title", { length: 255 }),
  kind: varchar("kind", { length: 20 }).notNull().default("project").$type<BudgetKind>(),
  language: varchar("language", { length: 2 }).notNull().default("es").$type<BudgetLanguage>(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD").$type<BudgetCurrency>(),
  status: varchar("status", { length: 20 }).notNull().default("draft").$type<BudgetStatus>(),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  validDays: integer("valid_days").notNull().default(30),
  sections: jsonb("sections").$type<BudgetSection[]>().notNull().default([]),
  // Manual total; null means the sum of section prices
  total: decimal("total", { precision: 14, scale: 2 }),
  showSectionPrices: boolean("show_section_prices").notNull().default(false),
  advancePercent: integer("advance_percent").notNull().default(30),
  showPaymentSchedule: boolean("show_payment_schedule").notNull().default(true),
  conditions: jsonb("conditions").$type<string[]>().notNull().default([]),
  // Never shown to the client
  internalNotes: text("internal_notes"),
  // Private client link: /b/{shareToken}, opened with sharePin.
  // The PIN is kept readable so it can be resent; it only guards this budget,
  // which lives in the same database anyway.
  shareToken: varchar("share_token", { length: 64 }).unique(),
  sharePin: varchar("share_pin", { length: 12 }),
  shareEnabled: boolean("share_enabled").notNull().default(false),
  shareFailedAttempts: integer("share_failed_attempts").notNull().default(0),
  shareLockedUntil: timestamp("share_locked_until"),
  shareViewCount: integer("share_view_count").notNull().default(0),
  shareLastViewedAt: timestamp("share_last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

export const budgetPhases = pgTable("budget_phases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // internal label in the library
  content: jsonb("content").$type<Record<BudgetLanguage, BudgetPhaseContent>>().notNull(),
  defaultPrice: jsonb("default_price").$type<Partial<Record<BudgetCurrency, number>>>().notNull().default({}),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type BudgetPhase = typeof budgetPhases.$inferSelect;
export type NewBudgetPhase = typeof budgetPhases.$inferInsert;

// Briefings (private client questionnaires, admin-only)
export type BriefingStatus = "draft" | "sent" | "in_progress" | "completed";
export type BriefingTopic = "business" | "audience" | "competition" | "personality" | "visual" | "logistics";
export type BriefingQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "slider" // scale between two opposite words
  | "links" // URLs with an optional note
  | "files";

// Question wording in one language; a library question stores both
export type BriefingQuestionContent = {
  title: string;
  help: string;
  options: string[]; // choice questions
  minLabel: string; // slider ends
  maxLabel: string;
};

export type BriefingQuestion = BriefingQuestionContent & {
  id: string;
  topic: BriefingTopic;
  type: BriefingQuestionType;
  required: boolean;
};

// Links and files share a shape; for an uploaded file the note holds its name
export type BriefingLink = { url: string; note: string };
export type BriefingAnswer = string | string[] | number | BriefingLink[];

export const briefings = pgTable("briefings", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(), // e.g. "BRF-2026-003"
  clientName: varchar("client_name", { length: 255 }).notNull(),
  // Heading override; defaults to "{CLIENT} BRIEFING"
  title: varchar("title", { length: 255 }),
  language: varchar("language", { length: 2 }).notNull().default("es").$type<BudgetLanguage>(),
  status: varchar("status", { length: 20 }).notNull().default("draft").$type<BriefingStatus>(),
  // Welcome text on the client's first screen
  intro: text("intro"),
  questions: jsonb("questions").$type<BriefingQuestion[]>().notNull().default([]),
  // Keyed by question id
  answers: jsonb("answers").$type<Record<string, BriefingAnswer>>().notNull().default({}),
  // Private notes per question id, never shown to the client
  answerNotes: jsonb("answer_notes").$type<Record<string, string>>().notNull().default({}),
  internalNotes: text("internal_notes"),
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  // Private client link: /f/{shareToken}, opened with sharePin (same scheme as budgets)
  shareToken: varchar("share_token", { length: 64 }).unique(),
  sharePin: varchar("share_pin", { length: 12 }),
  shareEnabled: boolean("share_enabled").notNull().default(false),
  shareFailedAttempts: integer("share_failed_attempts").notNull().default(0),
  shareLockedUntil: timestamp("share_locked_until"),
  shareViewCount: integer("share_view_count").notNull().default(0),
  shareLastViewedAt: timestamp("share_last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Briefing = typeof briefings.$inferSelect;
export type NewBriefing = typeof briefings.$inferInsert;

export const briefingQuestions = pgTable("briefing_questions", {
  id: serial("id").primaryKey(),
  topic: varchar("topic", { length: 20 }).notNull().$type<BriefingTopic>(),
  type: varchar("type", { length: 20 }).notNull().$type<BriefingQuestionType>(),
  required: boolean("required").notNull().default(false),
  content: jsonb("content").$type<Record<BudgetLanguage, BriefingQuestionContent>>().notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type BriefingLibraryQuestion = typeof briefingQuestions.$inferSelect;
export type NewBriefingLibraryQuestion = typeof briefingQuestions.$inferInsert;

// Saved sets of library questions to start a briefing from; ids keep templates bilingual
export const briefingTemplates = pgTable("briefing_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  questionIds: jsonb("question_ids").$type<number[]>().notNull().default([]),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type BriefingTemplate = typeof briefingTemplates.$inferSelect;
export type NewBriefingTemplate = typeof briefingTemplates.$inferInsert;
