import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { labProjects } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";

    const conditions = [];
    if (!includeUnpublished) {
      conditions.push(eq(labProjects.isPublished, true));
    }

    const items = await db
      .select()
      .from(labProjects)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(asc(labProjects.position), desc(labProjects.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch lab projects:", error);
    return NextResponse.json({ error: "Failed to fetch lab projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const [maxResult] = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${labProjects.position}), -1)` })
      .from(labProjects);
    const nextPosition = (maxResult?.maxPos ?? -1) + 1;

    const [newItem] = await db
      .insert(labProjects)
      .values({
        slug: body.slug,
        title: body.title,
        description: body.description,
        thumbnail: body.thumbnail,
        externalUrl: body.externalUrl,
        tool: body.tool,
        category: body.category,
        tags: body.tags ?? [],
        isPublished: body.isPublished ?? false,
        position: nextPosition,
      })
      .returning();

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Failed to create lab project:", error);
    return NextResponse.json({ error: "Failed to create lab project" }, { status: 500 });
  }
}
