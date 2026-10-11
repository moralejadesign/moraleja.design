import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgets, type NewBudget } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { generatePin, generateShareToken } from "@/lib/budget-share";

type ShareAction = "create" | "enable" | "disable" | "new-pin" | "new-link" | "unlock";

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

    const unlock = { shareFailedAttempts: 0, shareLockedUntil: null };
    let changes: Partial<NewBudget>;
    switch (action) {
      case "create":
        changes = {
          shareToken: budget.shareToken ?? generateShareToken(),
          sharePin: budget.sharePin ?? generatePin(),
          shareEnabled: true,
          ...unlock,
        };
        break;
      case "enable":
        changes = { shareEnabled: true };
        break;
      case "disable":
        changes = { shareEnabled: false };
        break;
      case "new-pin":
        changes = { sharePin: generatePin(), ...unlock };
        break;
      case "new-link":
        changes = { shareToken: generateShareToken(), shareViewCount: 0, shareLastViewedAt: null, ...unlock };
        break;
      case "unlock":
        changes = unlock;
        break;
      default:
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
