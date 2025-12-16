import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, assets, projects } from "@/db";
import { eq, sql, desc } from "drizzle-orm";
import { GalleryPhotoView } from "./gallery-photo-view";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

async function getAsset(id: number) {
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

export default async function GalleryPhotoPage({ params }: Props) {
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
