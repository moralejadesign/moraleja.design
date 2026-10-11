import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgets, type NewBudget } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";

// Fields the editor may change; code and share settings are managed separately
const EDITABLE_FIELDS = [
  "clientName",
  "title",
  "kind",
  "language",
  "currency",
  "status",
  "issueDate",
  "validDays",
  "sections",
  "total",
  "showSectionPrices",
  "advancePercent",
  "showPaymentSchedule",
  "conditions",
  "internalNotes",
] as const satisfies readonly (keyof NewBudget)[];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const [item] = await db.select().from(budgets).where(eq(budgets.id, parseInt(id, 10)));

    if (!item) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch budget:", error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}

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

    const changes: Partial<NewBudget> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) (changes as Record<string, unknown>)[field] = body[field];
    }
    if (changes.total === "") changes.total = null;

    const [updated] = await db
      .update(budgets)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(budgets.id, parseInt(id, 10)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update budget:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
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
      .delete(budgets)
      .where(eq(budgets.id, parseInt(id, 10)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete budget:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
