import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgets, type BudgetCurrency, type BudgetKind, type BudgetLanguage } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { DEFAULT_CONDITIONS, todayIso } from "@/lib/budgets";
import { nextBudgetCode } from "@/lib/budget-code";

export async function GET() {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db.select().from(budgets).orderBy(desc(budgets.createdAt));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch budgets:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const kind: BudgetKind = body.kind === "retainer" ? "retainer" : "project";
    const language: BudgetLanguage = body.language === "en" ? "en" : "es";
    const currency: BudgetCurrency = body.currency === "COP" ? "COP" : "USD";

    if (!body.clientName?.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(budgets)
      .values({
        code: await nextBudgetCode(),
        clientName: body.clientName.trim(),
        kind,
        language,
        currency,
        issueDate: todayIso(),
        conditions: DEFAULT_CONDITIONS[kind][language],
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create budget:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}
