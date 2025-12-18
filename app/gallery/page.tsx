import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GalleryGrid } from "@/components/gallery-grid";
import { db, assets, projects } from "@/db";
import { desc, sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse our collection of creative work, photography, and design assets.",
};

async function getAssets() {
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20">
        <div className="w-full px-3 py-8 md:px-8 md:py-12 lg:px-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Gallery</h1>
            <p className="text-muted-foreground">
              Browse our collection of creative work
            </p>
          </div>
          <Suspense fallback={<div className="text-muted-foreground">Loading gallery...</div>}>
            <GalleryGrid assets={allAssets} availableTags={allTags} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

