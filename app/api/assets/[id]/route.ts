import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, assets } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assetId = parseInt(id, 10);

    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, assetId));

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Failed to fetch asset:", error);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const assetId = parseInt(id, 10);
    const body = await request.json();

    const [updatedAsset] = await db
      .update(assets)
      .set({
        title: body.title,
        description: body.description,
        altText: body.altText,
        tags: body.tags,
        keywords: body.keywords,
        projectId: body.projectId,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
      .returning();

    if (!updatedAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error("Failed to update asset:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const assetId = parseInt(id, 10);

    const [deletedAsset] = await db
      .delete(assets)
      .where(eq(assets.id, assetId))
      .returning();

    if (!deletedAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete asset:", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}

