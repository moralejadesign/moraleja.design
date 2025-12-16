import { NextResponse } from "next/server";
import { db, assets, projects } from "@/db";
import { eq, sql, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assetId = parseInt(id, 10);

  if (isNaN(assetId)) {
    return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
  }

  // Get all assets for navigation context
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
    .orderBy(desc(assets.createdAt));

  const currentAsset = allAssets.find((a) => a.id === assetId);

  if (!currentAsset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({
    asset: currentAsset,
    assets: allAssets,
  });
}
