import { pgTable, serial, varchar, text, real, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";

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
