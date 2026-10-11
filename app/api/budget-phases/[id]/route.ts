import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgetPhases } from "@/db/schema";
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
      .update(budgetPhases)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.defaultPrice !== undefined && { defaultPrice: body.defaultPrice }),
        updatedAt: new Date(),
      })
      .where(eq(budgetPhases.id, parseInt(id, 10)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update budget phase:", error);
    return NextResponse.json({ error: "Failed to update budget phase" }, { status: 500 });
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
      .delete(budgetPhases)
      .where(eq(budgetPhases.id, parseInt(id, 10)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete budget phase:", error);
    return NextResponse.json({ error: "Failed to delete budget phase" }, { status: 500 });
  }
}
