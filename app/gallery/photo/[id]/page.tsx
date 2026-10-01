import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db, assets, projects } from "@/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { GalleryPhotoView } from "./gallery-photo-view";
import { cacheLife, cacheTag } from "next/cache";

type Props = {
  params: Promise<{ id: string }>;
};

async function getAsset(id: number) {
  "use cache";
  cacheLife("max");
  cacheTag("assets", "projects");
  const result = await db
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
    .where(eq(assets.id, id))
    .limit(1);

  return result[0] || null;
}

async function getAllAssets() {
  "use cache";
  cacheLife("max");
  cacheTag("assets", "projects");
  return await db
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const assetId = parseInt(id, 10);

  if (isNaN(assetId)) {
    return { title: "Photo Not Found" };
  }

  const asset = await getAsset(assetId);

  if (!asset) {
    return { title: "Photo Not Found" };
  }

  return {
    title: asset.title || "Gallery Photo",
    description: asset.description || "View this photo in our gallery",
    openGraph: {
      title: asset.title || "Gallery Photo",
      description: asset.description || "View this photo in our gallery",
      images: asset.type === "image" ? [asset.url] : undefined,
    },
  };
}

// The newest photos are prerendered; the rest are built on first visit
export async function generateStaticParams() {
  const allAssets = await getAllAssets();
  return allAssets.slice(0, 12).map((asset) => ({ id: String(asset.id) }));
}

async function PhotoContent({ params }: Props) {
  const { id } = await params;
  const assetId = parseInt(id, 10);

  if (isNaN(assetId)) {
    notFound();
  }

  const [asset, allAssets] = await Promise.all([
    getAsset(assetId),
    getAllAssets(),
  ]);

  if (!asset) {
    notFound();
  }

  return <GalleryPhotoView asset={asset} assets={allAssets} />;
}

export default function GalleryPhotoPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" aria-busy="true" />}>
      <PhotoContent params={params} />
    </Suspense>
  );
}
