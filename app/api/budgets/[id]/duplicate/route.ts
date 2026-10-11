import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { newSectionId, todayIso } from "@/lib/budgets";
import { nextBudgetCode } from "@/lib/budget-code";

/** Copies a budget as a new draft, optionally for another client. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const [source] = await db.select().from(budgets).where(eq(budgets.id, parseInt(id, 10)));

    if (!source) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const clientName = body.clientName?.trim() || source.clientName;

    const [created] = await db
      .insert(budgets)
      .values({
        code: await nextBudgetCode(),
        clientName,
        // A custom heading usually names the old client, so drop it for a new one
        title: clientName === source.clientName ? source.title : null,
        kind: source.kind,
        language: source.language,
        currency: source.currency,
        issueDate: todayIso(),
        validDays: source.validDays,
        sections: source.sections.map((s) => ({ ...s, id: newSectionId() })),
        total: source.total,
        showSectionPrices: source.showSectionPrices,
        advancePercent: source.advancePercent,
        showPaymentSchedule: source.showPaymentSchedule,
        conditions: source.conditions,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to duplicate budget:", error);
    return NextResponse.json({ error: "Failed to duplicate budget" }, { status: 500 });
  }
}
