import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { projects, type BlockType } from "../db/schema";
import projectsData from "../data/projects.json";

const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL || "https://xw2hxxlahhw8mflm.public.blob.vercel-storage.com";

interface OldProject {
  id: number;
  slug: string;
  title: string;
  thumbnail: string;
  heightRatio: number;
  images: string[];
  content: {
    description: string;
    text: string;
  };
  textContrast?: "light" | "dark";
}

function convertToBlocks(oldProject: OldProject): BlockType[] {
  const blocks: BlockType[] = [];

  // Add description as heading if exists
  if (oldProject.content.description) {
    blocks.push({
      type: "text",
      content: oldProject.content.description,
    });
  }

  // Convert images to full-image blocks
  for (const image of oldProject.images) {
    // Convert local paths to blob URLs
    const url = image.startsWith("/")
      ? `${BLOB_BASE_URL}${image}`
      : image;

    blocks.push({
      type: "full-image",
      url,
      alt: `${oldProject.title} image`,
    });
  }

  // Add text content if exists
  if (oldProject.content.text) {
    blocks.push({
      type: "text",
      content: oldProject.content.text,
    });
  }

  return blocks;
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Starting migration...");
  console.log(`Found ${(projectsData as OldProject[]).length} projects to migrate`);

  // Use a Set to track unique slugs (avoid duplicates)
  const seenSlugs = new Set<string>();
  let position = 0;

  for (const oldProject of projectsData as OldProject[]) {
    // Skip if we've already seen this slug
    if (seenSlugs.has(oldProject.slug)) {
      console.log(`Skipping duplicate slug: ${oldProject.slug}`);
      continue;
    }
    seenSlugs.add(oldProject.slug);

    const blocks = convertToBlocks(oldProject);

    // Convert thumbnail path to blob URL
    const thumbnail = oldProject.thumbnail.startsWith("/")
      ? `${BLOB_BASE_URL}${oldProject.thumbnail}`
      : oldProject.thumbnail;

    try {
      await db.insert(projects).values({
        slug: oldProject.slug,
        title: oldProject.title,
        thumbnail,
        heightRatio: oldProject.heightRatio,
        textContrast: oldProject.textContrast || "light",
        blocks,
        position: position++,
      });
      console.log(`✓ Migrated: ${oldProject.title}`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${oldProject.title}:`, error);
    }
  }

  console.log("\nMigration complete!");
}

migrate().catch(console.error);
