import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefingQuestions } from "@/db/schema";
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
      .update(briefingQuestions)
      .set({
        ...(body.topic !== undefined && { topic: body.topic }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.required !== undefined && { required: !!body.required }),
        ...(body.content !== undefined && { content: body.content }),
        updatedAt: new Date(),
      })
      .where(eq(briefingQuestions.id, parseInt(id, 10)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update briefing question:", error);
    return NextResponse.json({ error: "Failed to update briefing question" }, { status: 500 });
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
      .delete(briefingQuestions)
      .where(eq(briefingQuestions.id, parseInt(id, 10)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete briefing question:", error);
    return NextResponse.json({ error: "Failed to delete briefing question" }, { status: 500 });
  }
}
