/**
 * Migration script to backfill assets from existing project blocks.
 * 
 * This script:
 * 1. Fetches all projects
 * 2. Extracts URLs from media blocks (full-image, two-column, image-text, video, video-row)
 * 3. Creates asset records for each unique URL
 * 4. Updates blocks to include assetId references
 * 
 * Safe to run multiple times - uses upsert logic based on unique URL constraint.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import * as schema from "../db/schema";

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

type BlockType = schema.BlockType;

function getAssetType(url: string): "image" | "video" {
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext)) ? "video" : "image";
}

function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split("/").pop() || "unknown";
  } catch {
    return url.split("/").pop() || "unknown";
  }
}

interface UrlInfo {
  url: string;
  type: "image" | "video";
  projectId: number;
}

async function findOrCreateAsset(urlInfo: UrlInfo): Promise<number> {
  // Check if asset already exists
  const existing = await db
    .select({ id: schema.assets.id })
    .from(schema.assets)
    .where(eq(schema.assets.url, urlInfo.url))
    .limit(1);

  if (existing.length > 0) {
    console.log(`  Asset exists for: ${urlInfo.url.substring(0, 50)}...`);
    return existing[0].id;
  }

  // Create new asset
  const [newAsset] = await db
    .insert(schema.assets)
    .values({
      url: urlInfo.url,
      type: urlInfo.type,
      filename: extractFilename(urlInfo.url),
      projectId: urlInfo.projectId,
    })
    .returning({ id: schema.assets.id });

  console.log(`  Created asset #${newAsset.id} for: ${urlInfo.url.substring(0, 50)}...`);
  return newAsset.id;
}

function extractUrlsFromBlocks(blocks: BlockType[], projectId: number): UrlInfo[] {
  const urls: UrlInfo[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "full-image":
        if (block.url) {
          urls.push({ url: block.url, type: "image", projectId });
        }
        break;

      case "two-column":
        if (block.left) {
          urls.push({ url: block.left, type: "image", projectId });
        }
        if (block.right) {
          urls.push({ url: block.right, type: "image", projectId });
        }
        break;

      case "image-text":
        if (block.image) {
          urls.push({ url: block.image, type: "image", projectId });
        }
        break;

      case "video":
        if (block.url) {
          urls.push({ url: block.url, type: "video", projectId });
        }
        break;

      case "video-row":
        for (const video of block.videos) {
          if (video.url) {
            urls.push({ url: video.url, type: "video", projectId });
          }
        }
        break;
    }
  }

  return urls;
}

async function updateBlocksWithAssetIds(
  projectId: number,
  blocks: BlockType[],
  urlToAssetId: Map<string, number>
): Promise<BlockType[]> {
  const updatedBlocks: BlockType[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "full-image":
        updatedBlocks.push({
          ...block,
          assetId: block.url ? urlToAssetId.get(block.url) : undefined,
        });
        break;

      case "two-column":
        updatedBlocks.push({
          ...block,
          leftAssetId: block.left ? urlToAssetId.get(block.left) : undefined,
          rightAssetId: block.right ? urlToAssetId.get(block.right) : undefined,
        });
        break;

      case "image-text":
        updatedBlocks.push({
          ...block,
          assetId: block.image ? urlToAssetId.get(block.image) : undefined,
        });
        break;

      case "video":
        updatedBlocks.push({
          ...block,
          assetId: block.url ? urlToAssetId.get(block.url) : undefined,
        });
        break;

      case "video-row":
        updatedBlocks.push({
          ...block,
          videos: block.videos.map((video) => ({
            ...video,
            assetId: video.url ? urlToAssetId.get(video.url) : undefined,
          })),
        });
        break;

      default:
        updatedBlocks.push(block);
    }
  }

  return updatedBlocks;
}

async function migrateProject(project: schema.Project): Promise<void> {
  console.log(`\nProcessing project: ${project.title} (ID: ${project.id})`);

  const blocks = project.blocks as BlockType[];
  if (!blocks || blocks.length === 0) {
    console.log("  No blocks found, skipping...");
    return;
  }

  // Extract URLs from blocks
  const urlInfos = extractUrlsFromBlocks(blocks, project.id);
  if (urlInfos.length === 0) {
    console.log("  No media URLs found in blocks, skipping...");
    return;
  }

  console.log(`  Found ${urlInfos.length} media URLs in blocks`);

  // Create/find assets and build URL -> assetId map
  const urlToAssetId = new Map<string, number>();
  for (const urlInfo of urlInfos) {
    if (!urlToAssetId.has(urlInfo.url)) {
      const assetId = await findOrCreateAsset(urlInfo);
      urlToAssetId.set(urlInfo.url, assetId);
    }
  }

  // Update blocks with assetIds
  const updatedBlocks = await updateBlocksWithAssetIds(project.id, blocks, urlToAssetId);

  // Save updated blocks
  await db
    .update(schema.projects)
    .set({ blocks: updatedBlocks, updatedAt: new Date() })
    .where(eq(schema.projects.id, project.id));

  console.log(`  Updated ${urlInfos.length} block references with asset IDs`);

  // Also create asset for thumbnail if it's a URL
  if (project.thumbnail && project.thumbnail.startsWith("http")) {
    const thumbnailAssetId = await findOrCreateAsset({
      url: project.thumbnail,
      type: "image",
      projectId: project.id,
    });
    console.log(`  Thumbnail asset: #${thumbnailAssetId}`);
  }
}

async function main() {
  console.log("Starting blocks to assets migration...\n");
  console.log("=".repeat(50));

  // Fetch all projects
  const allProjects = await db.select().from(schema.projects);
  console.log(`Found ${allProjects.length} projects to process`);

  let totalAssets = 0;
  for (const project of allProjects) {
    await migrateProject(project);
  }

  // Count total assets created
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.assets);

  console.log("\n" + "=".repeat(50));
  console.log(`Migration complete! Total assets in database: ${count}`);
}

main().catch(console.error);

