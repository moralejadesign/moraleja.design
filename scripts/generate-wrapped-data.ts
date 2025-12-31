import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { count, eq, sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { wrappedConfig } from "../lib/wrapped-config";
import * as fs from "fs";
import * as path from "path";

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

interface WrappedData {
  year: number;
  generatedAt: string;
  
  // Database metrics
  metrics: {
    totalProjects: number;
    totalAssets: number;
    totalVideos: number;
    totalImages: number;
  };
  
  // Manual config values
  videoEditingMinutes: number;
  industries: string[];
  countries: Array<{ name: string; flag: string }>;
  
  // All projects (for partners/clients showcase)
  projects: Array<{
    slug: string;
    title: string;
    thumbnail: string;
  }>;
  
  // Featured project
  featuredProject: {
    slug: string;
    title: string;
    thumbnail: string;
  } | null;
  
  // Studio info
  studio: typeof wrappedConfig.studio;
  socialLinks: typeof wrappedConfig.socialLinks;
}

async function generateWrappedData(): Promise<WrappedData> {
  console.log("🎁 Generating Moraleja Wrapped 2025 data...\n");

  // Count total projects
  const [projectsResult] = await db
    .select({ count: count() })
    .from(schema.projects);
  const totalProjects = projectsResult?.count ?? 0;
  console.log(`📁 Total projects: ${totalProjects}`);

  // Count total assets
  const [assetsResult] = await db
    .select({ count: count() })
    .from(schema.assets);
  const totalAssets = assetsResult?.count ?? 0;
  console.log(`🖼️  Total assets: ${totalAssets}`);

  // Count videos
  const [videosResult] = await db
    .select({ count: count() })
    .from(schema.assets)
    .where(eq(schema.assets.type, "video"));
  const totalVideos = videosResult?.count ?? 0;
  console.log(`🎬 Total videos: ${totalVideos}`);

  // Count images
  const [imagesResult] = await db
    .select({ count: count() })
    .from(schema.assets)
    .where(eq(schema.assets.type, "image"));
  const totalImages = imagesResult?.count ?? 0;
  console.log(`📸 Total images: ${totalImages}`);

  // Get all projects (for partners/clients showcase)
  const allProjects = await db
    .select({
      slug: schema.projects.slug,
      title: schema.projects.title,
      thumbnail: schema.projects.thumbnail,
    })
    .from(schema.projects)
    .orderBy(schema.projects.position);
  console.log(`🤝 Projects for showcase: ${allProjects.length}`);

  // Get featured project
  let featuredProject: WrappedData["featuredProject"] = null;
  
  if (wrappedConfig.featuredProjectSlug) {
    const [project] = await db
      .select({
        slug: schema.projects.slug,
        title: schema.projects.title,
        thumbnail: schema.projects.thumbnail,
      })
      .from(schema.projects)
      .where(eq(schema.projects.slug, wrappedConfig.featuredProjectSlug))
      .limit(1);
    
    if (project) {
      featuredProject = project;
      console.log(`⭐ Featured project: ${project.title}`);
    } else {
      // Fallback to first project if featured not found
      const [firstProject] = await db
        .select({
          slug: schema.projects.slug,
          title: schema.projects.title,
          thumbnail: schema.projects.thumbnail,
        })
        .from(schema.projects)
        .orderBy(schema.projects.position)
        .limit(1);
      
      if (firstProject) {
        featuredProject = firstProject;
        console.log(`⭐ Featured project (fallback): ${firstProject.title}`);
      }
    }
  }

  const data: WrappedData = {
    year: wrappedConfig.year,
    generatedAt: new Date().toISOString(),
    
    metrics: {
      totalProjects,
      totalAssets,
      totalVideos,
      totalImages,
    },
    
    videoEditingMinutes: wrappedConfig.videoEditingMinutes,
    industries: [...wrappedConfig.industries],
    countries: [...wrappedConfig.countries],
    
    projects: allProjects,
    featuredProject,
    
    studio: { ...wrappedConfig.studio },
    socialLinks: { ...wrappedConfig.socialLinks },
  };

  return data;
}

async function main() {
  try {
    const data = await generateWrappedData();
    
    // Write to data folder
    const outputPath = path.join(process.cwd(), "data", "wrapped-2025.json");
    
    // Ensure data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`\n✅ Wrapped data saved to: ${outputPath}`);
    console.log("\nSummary:");
    console.log(`  - Projects: ${data.metrics.totalProjects}`);
    console.log(`  - Assets: ${data.metrics.totalAssets}`);
    console.log(`  - Videos: ${data.metrics.totalVideos}`);
    console.log(`  - Images: ${data.metrics.totalImages}`);
    console.log(`  - Video editing: ${data.videoEditingMinutes} minutes`);
    console.log(`  - Industries: ${data.industries.length}`);
    console.log(`  - Countries: ${data.countries.length}`);
    
  } catch (error) {
    console.error("❌ Error generating wrapped data:", error);
    process.exit(1);
  }
}

main();

