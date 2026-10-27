import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  billingProfile,
  budgets,
  chargeAccounts,
  type BudgetCurrency,
  type BudgetLanguage,
  type ChargeItem,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { todayIso } from "@/lib/budgets";
import { nextChargeCode } from "@/lib/budget-code";
import { DEFAULT_CHARGE_NOTES, emptyChargeItem, presetItems, type ChargePreset } from "@/lib/charges";

const PRESETS: ChargePreset[] = ["advance", "balance", "total", "month"];

export async function GET(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const budgetId = new URL(request.url).searchParams.get("budgetId");
    const items = await db
      .select()
      .from(chargeAccounts)
      .where(budgetId ? eq(chargeAccounts.budgetId, parseInt(budgetId, 10)) : undefined)
      .orderBy(desc(chargeAccounts.createdAt));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch charge accounts:", error);
    return NextResponse.json({ error: "Failed to fetch charge accounts" }, { status: 500 });
  }
}

/** Creates a blank cuenta de cobro, or one filled from a budget with a preset. */
export async function POST(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const [profile] = await db.select().from(billingProfile).where(eq(billingProfile.id, 1));
    const today = todayIso();

    let clientName: string = body.clientName?.trim() ?? "";
    let language: BudgetLanguage = body.language === "en" ? "en" : "es";
    let currency: BudgetCurrency = body.currency === "USD" ? "USD" : "COP";
    let items: ChargeItem[] = [emptyChargeItem()];
    let budgetId: number | null = null;

    if (body.budgetId) {
      const [budget] = await db.select().from(budgets).where(eq(budgets.id, Number(body.budgetId)));
      if (!budget) {
        return NextResponse.json({ error: "Budget not found" }, { status: 404 });
      }
      const preset: ChargePreset = PRESETS.includes(body.preset) ? body.preset : "total";
      budgetId = budget.id;
      clientName = budget.clientName;
      language = budget.language;
      currency = budget.currency;
      items = presetItems(budget, preset, today);
    }

    if (!clientName) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(chargeAccounts)
      .values({
        code: await nextChargeCode(),
        budgetId,
        clientName,
        language,
        currency,
        issueDate: today,
        city: profile?.city || null,
        items,
        paymentDetails: profile?.paymentDetails || null,
        notes: DEFAULT_CHARGE_NOTES[language],
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create charge account:", error);
    return NextResponse.json({ error: "Failed to create charge account" }, { status: 500 });
  }
}
