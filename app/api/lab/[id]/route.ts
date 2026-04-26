import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { labProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isNumeric = /^\d+$/.test(id);

    const [item] = isNumeric
      ? await db.select().from(labProjects).where(eq(labProjects.id, parseInt(id, 10)))
      : await db.select().from(labProjects).where(eq(labProjects.slug, id));

    if (!item) {
      return NextResponse.json({ error: "Lab project not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch lab project:", error);
    return NextResponse.json({ error: "Failed to fetch lab project" }, { status: 500 });
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
    const itemId = parseInt(id, 10);
    const body = await request.json();

    const [updated] = await db
      .update(labProjects)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(labProjects.id, itemId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Lab project not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update lab project:", error);
    return NextResponse.json({ error: "Failed to update lab project" }, { status: 500 });
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
    const itemId = parseInt(id, 10);

    const [deleted] = await db
      .delete(labProjects)
      .where(eq(labProjects.id, itemId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Lab project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lab project:", error);
    return NextResponse.json({ error: "Failed to delete lab project" }, { status: 500 });
  }
}
