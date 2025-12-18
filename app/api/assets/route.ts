import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, assets } from "@/db";
import { desc, eq, ilike, or, sql, arrayContains } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const projectId = searchParams.get("projectId");
    const url = searchParams.get("url");

    const conditions = [];

    // URL exact match (for asset lookup by URL)
    if (url) {
      conditions.push(eq(assets.url, url));
    }

    // Type filter
    if (type && (type === "image" || type === "video")) {
      conditions.push(eq(assets.type, type));
    }

    // Project filter
    if (projectId) {
      conditions.push(eq(assets.projectId, parseInt(projectId, 10)));
    }

    // Search across title, description, keywords
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(assets.title, searchPattern),
          ilike(assets.description, searchPattern),
          ilike(assets.keywords, searchPattern),
          ilike(assets.altText, searchPattern)
        )
      );
    }

    // Tag filter - find assets containing any of the specified tags
    if (tags && tags.length > 0) {
      conditions.push(sql`${assets.tags} && ${tags}`);
    }

    const allAssets = await db
      .select()
      .from(assets)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(desc(assets.createdAt));

    return NextResponse.json(allAssets);
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const [newAsset] = await db
      .insert(assets)
      .values({
        url: body.url,
        type: body.type,
        filename: body.filename,
        title: body.title,
        description: body.description,
        altText: body.altText,
        tags: body.tags,
        keywords: body.keywords,
        projectId: body.projectId,
        showInGallery: body.showInGallery !== undefined ? body.showInGallery : true,
      })
      .returning();

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error("Failed to create asset:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}

