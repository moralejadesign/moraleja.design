import { pgTable, serial, varchar, text, real, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export type BlockType = 
  | { type: "full-image"; url: string; alt?: string }
  | { type: "two-column"; left: string; right: string }
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
