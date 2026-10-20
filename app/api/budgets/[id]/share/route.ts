import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { shareChanges, type ShareAction } from "@/lib/budget-share";

/** Manages the client link: create, turn on/off, new PIN, new link, unlock. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const budgetId = parseInt(id, 10);
    const { action } = (await request.json()) as { action: ShareAction };

    const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId));
    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const changes = shareChanges(action, budget);
    if (!changes) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const [updated] = await db
      .update(budgets)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(budgets.id, budgetId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update budget link:", error);
    return NextResponse.json({ error: "Failed to update budget link" }, { status: 500 });
  }
}
