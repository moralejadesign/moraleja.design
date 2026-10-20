import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefingTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(briefingTemplates)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.questionIds !== undefined && { questionIds: body.questionIds }),
        updatedAt: new Date(),
      })
      .where(eq(briefingTemplates.id, parseInt(id, 10)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update briefing template:", error);
    return NextResponse.json({ error: "Failed to update briefing template" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(briefingTemplates)
      .where(eq(briefingTemplates.id, parseInt(id, 10)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete briefing template:", error);
    return NextResponse.json({ error: "Failed to delete briefing template" }, { status: 500 });
  }
}
