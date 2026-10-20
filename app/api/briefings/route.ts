import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefings, type BudgetLanguage } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { DEFAULT_INTRO } from "@/lib/briefings";
import { nextBriefingCode } from "@/lib/budget-code";

export async function GET() {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db.select().from(briefings).orderBy(desc(briefings.createdAt));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch briefings:", error);
    return NextResponse.json({ error: "Failed to fetch briefings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const language: BudgetLanguage = body.language === "en" ? "en" : "es";

    if (!body.clientName?.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(briefings)
      .values({
        code: await nextBriefingCode(),
        clientName: body.clientName.trim(),
        language,
        intro: DEFAULT_INTRO[language],
        questions: Array.isArray(body.questions) ? body.questions : [],
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create briefing:", error);
    return NextResponse.json({ error: "Failed to create briefing" }, { status: 500 });
  }
}
