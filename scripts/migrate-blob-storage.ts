/**
 * Migration script to transfer assets from old Vercel Blob storage to new storage.
 * 
 * Environment variables required:
 * - DATABASE_URL: Neon database connection string
 * - BLOB_READ_WRITE_TOKEN: Token for new blob storage (upload)
 * - OLD_BLOB_READ_WRITE_TOKEN: Token for old blob storage (optional, for deletion)
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import * as schema from "../db/schema";

const OLD_BLOB_BASE = "https://oi0bl4shqruqbuco.public.blob.vercel-storage.com";
const NEW_BLOB_BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL || "https://xw2hxxlahhw8mflm.public.blob.vercel-storage.com";

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

type BlockType = schema.BlockType;

// Track URL mappings for batch updates
const urlMappings = new Map<string, string>();

function isOldBlobUrl(url: string): boolean {
  return url.startsWith(OLD_BLOB_BASE);
}

function extractPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1); // Remove leading slash
  } catch {
    return url.split("/").slice(3).join("/");
  }
}

async function downloadFile(url: string): Promise<{ data: ArrayBuffer; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${url} - ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const data = await response.arrayBuffer();
  return { data, contentType };
}

async function uploadToNewStorage(
  path: string,
  data: ArrayBuffer,
  contentType: string
): Promise<string> {
  const blob = await put(path, data, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return blob.url;
}

async function migrateUrl(oldUrl: string): Promise<string> {
  // Skip if not from old storage
  if (!isOldBlobUrl(oldUrl)) {
    return oldUrl;
  }

  // Return cached mapping if already migrated
  if (urlMappings.has(oldUrl)) {
    return urlMappings.get(oldUrl)!;
  }

  const path = extractPathFromUrl(oldUrl);
  console.log(`  Migrating: ${path}`);

  try {
    const { data, contentType } = await downloadFile(oldUrl);
    console.log(`    Downloaded: ${(data.byteLength / 1024).toFixed(1)} KB`);

    const newUrl = await uploadToNewStorage(path, data, contentType);
    console.log(`    Uploaded to: ${newUrl}`);

    urlMappings.set(oldUrl, newUrl);
    return newUrl;
  } catch (error) {
    console.error(`    ERROR: ${(error as Error).message}`);
    throw error;
  }
}

function replaceUrlInString(str: string): string {
  if (!str) return str;
  
  for (const [oldUrl, newUrl] of urlMappings) {
    str = str.replace(oldUrl, newUrl);
  }
  return str;
}

async function updateBlockUrls(blocks: BlockType[]): Promise<BlockType[]> {
  const updatedBlocks: BlockType[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "full-image":
        updatedBlocks.push({
          ...block,
          url: replaceUrlInString(block.url),
        });
        break;

      case "two-column":
        updatedBlocks.push({
          ...block,
          left: replaceUrlInString(block.left),
          right: replaceUrlInString(block.right),
        });
        break;

      case "image-text":
        updatedBlocks.push({
          ...block,
          image: replaceUrlInString(block.image),
        });
        break;

      case "video":
        updatedBlocks.push({
          ...block,
          url: replaceUrlInString(block.url),
        });
        break;

      case "video-row":
        updatedBlocks.push({
          ...block,
          videos: block.videos.map((video) => ({
            ...video,
            url: replaceUrlInString(video.url),
          })),
        });
        break;

      default:
        updatedBlocks.push(block);
    }
  }

  return updatedBlocks;
}

function extractUrlsFromBlocks(blocks: BlockType[]): string[] {
  const urls: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "full-image":
        if (block.url && isOldBlobUrl(block.url)) urls.push(block.url);
        break;
      case "two-column":
        if (block.left && isOldBlobUrl(block.left)) urls.push(block.left);
        if (block.right && isOldBlobUrl(block.right)) urls.push(block.right);
        break;
      case "image-text":
        if (block.image && isOldBlobUrl(block.image)) urls.push(block.image);
        break;
      case "video":
        if (block.url && isOldBlobUrl(block.url)) urls.push(block.url);
        break;
      case "video-row":
        for (const video of block.videos) {
          if (video.url && isOldBlobUrl(video.url)) urls.push(video.url);
        }
        break;
    }
  }

  return urls;
}

async function collectAllUrls(): Promise<Set<string>> {
  const allUrls = new Set<string>();

  // Collect from assets table
  console.log("\nCollecting URLs from assets table...");
  const assets = await db.select({ url: schema.assets.url }).from(schema.assets);
  for (const asset of assets) {
    if (isOldBlobUrl(asset.url)) {
      allUrls.add(asset.url);
    }
  }
  console.log(`  Found ${allUrls.size} asset URLs to migrate`);

  // Collect from projects table
  console.log("\nCollecting URLs from projects table...");
  const projects = await db.select().from(schema.projects);
  
  let thumbnailCount = 0;
  let blockUrlCount = 0;

  for (const project of projects) {
    if (project.thumbnail && isOldBlobUrl(project.thumbnail)) {
      allUrls.add(project.thumbnail);
      thumbnailCount++;
    }

    const blocks = project.blocks as BlockType[];
    if (blocks && blocks.length > 0) {
      const blockUrls = extractUrlsFromBlocks(blocks);
      for (const url of blockUrls) {
        allUrls.add(url);
        blockUrlCount++;
      }
    }
  }

  console.log(`  Found ${thumbnailCount} thumbnail URLs to migrate`);
  console.log(`  Found ${blockUrlCount} block URLs to migrate`);
  console.log(`\nTotal unique URLs to migrate: ${allUrls.size}`);

  return allUrls;
}

async function migrateAllFiles(urls: Set<string>): Promise<void> {
  console.log("\n" + "=".repeat(50));
  console.log("PHASE 1: Downloading and uploading files");
  console.log("=".repeat(50));

  let success = 0;
  let failed = 0;
  const total = urls.size;

  for (const url of urls) {
    console.log(`\n[${success + failed + 1}/${total}]`);
    try {
      await migrateUrl(url);
      success++;
    } catch {
      failed++;
    }
  }

  console.log(`\n\nFile migration complete: ${success} succeeded, ${failed} failed`);
}

async function updateDatabase(): Promise<void> {
  console.log("\n" + "=".repeat(50));
  console.log("PHASE 2: Updating database records");
  console.log("=".repeat(50));

  // Update assets table
  console.log("\nUpdating assets table...");
  const assets = await db.select().from(schema.assets);
  let assetsUpdated = 0;

  for (const asset of assets) {
    if (urlMappings.has(asset.url)) {
      const newUrl = urlMappings.get(asset.url)!;
      await db
        .update(schema.assets)
        .set({ url: newUrl, updatedAt: new Date() })
        .where(eq(schema.assets.id, asset.id));
      assetsUpdated++;
    }
  }
  console.log(`  Updated ${assetsUpdated} asset records`);

  // Update projects table
  console.log("\nUpdating projects table...");
  const projects = await db.select().from(schema.projects);
  let projectsUpdated = 0;

  for (const project of projects) {
    let needsUpdate = false;
    const updates: Partial<schema.Project> = {};

    // Update thumbnail
    if (project.thumbnail && urlMappings.has(project.thumbnail)) {
      updates.thumbnail = urlMappings.get(project.thumbnail)!;
      needsUpdate = true;
    }

    // Update blocks
    const blocks = project.blocks as BlockType[];
    if (blocks && blocks.length > 0) {
      const hasOldUrls = extractUrlsFromBlocks(blocks).length > 0;
      if (hasOldUrls) {
        updates.blocks = await updateBlockUrls(blocks);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      updates.updatedAt = new Date();
      await db
        .update(schema.projects)
        .set(updates)
        .where(eq(schema.projects.id, project.id));
      projectsUpdated++;
      console.log(`  Updated project: ${project.title}`);
    }
  }

  console.log(`\n  Updated ${projectsUpdated} project records`);
}

async function main() {
  console.log("=".repeat(50));
  console.log("BLOB STORAGE MIGRATION");
  console.log("=".repeat(50));
  console.log(`\nFrom: ${OLD_BLOB_BASE}`);
  console.log(`To:   ${NEW_BLOB_BASE}`);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("\nERROR: BLOB_READ_WRITE_TOKEN is required for uploads");
    process.exit(1);
  }

  // Collect all unique URLs
  const urls = await collectAllUrls();

  if (urls.size === 0) {
    console.log("\nNo URLs need migration. Exiting.");
    return;
  }

  // Phase 1: Download and upload all files
  await migrateAllFiles(urls);

  // Phase 2: Update database records
  await updateDatabase();

  console.log("\n" + "=".repeat(50));
  console.log("MIGRATION COMPLETE");
  console.log("=".repeat(50));
  console.log(`\nTotal URLs migrated: ${urlMappings.size}`);
  console.log("\nRemember to update hardcoded URLs in:");
  console.log("  - lib/config.ts");
  console.log("  - app/about/page.tsx");
}

main().catch((error) => {
  console.error("\nMigration failed:", error);
  process.exit(1);
});
