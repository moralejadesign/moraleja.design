import { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/page-intro";
import { GalleryGrid } from "@/components/gallery-grid";
import { db, assets, projects } from "@/db";
import { desc, sql, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse our collection of creative work, photography, and design assets.",
};

async function getAssets() {
  "use cache";
  cacheLife("max");
  cacheTag("assets", "projects");
  const allAssets = await db
    .select({
      id: assets.id,
      url: assets.url,
      type: assets.type,
      title: assets.title,
      description: assets.description,
      altText: assets.altText,
      tags: assets.tags,
      projectId: assets.projectId,
      projectTitle: projects.title,
      projectSlug: projects.slug,
    })
    .from(assets)
    .leftJoin(projects, sql`${assets.projectId} = ${projects.id}`)
    .where(eq(assets.showInGallery, true))
    .orderBy(desc(assets.createdAt));

  return allAssets;
}

async function getAllTags() {
  "use cache";
  cacheLife("max");
  cacheTag("assets", "projects");
  const result = await db
    .select({ tags: assets.tags })
    .from(assets)
    .where(sql`${assets.showInGallery} = true AND ${assets.tags} IS NOT NULL AND array_length(${assets.tags}, 1) > 0`);

  const allTags = new Set<string>();
  result.forEach((row) => {
    row.tags?.forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

export default async function GalleryPage() {
  const [allAssets, allTags] = await Promise.all([getAssets(), getAllTags()]);

  return (
    <>
      <PageIntro name="Gallery" statement="is every frame behind the work." lede="Stills, motion and process from across Moraleja's projects." />
      <Suspense fallback={<div className="text-muted-foreground">Loading gallery...</div>}>
        <GalleryGrid assets={allAssets} availableTags={allTags} />
      </Suspense>
    </>
  );
}

