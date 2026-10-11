import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgetPhases } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { STARTER_PHASES } from "@/lib/budgets";

export async function GET() {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db
      .select()
      .from(budgetPhases)
      .orderBy(asc(budgetPhases.position), asc(budgetPhases.id));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch budget phases:", error);
    return NextResponse.json({ error: "Failed to fetch budget phases" }, { status: 500 });
  }
}

/** Creates one phase, or loads the starter library with { starter: true }. */
export async function POST(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const [maxResult] = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${budgetPhases.position}), -1)` })
      .from(budgetPhases);
    const nextPosition = (maxResult?.maxPos ?? -1) + 1;

    if (body.starter) {
      const created = await db
        .insert(budgetPhases)
        .values(
          STARTER_PHASES.map((phase, i) => ({ ...phase, position: nextPosition + i }))
        )
        .returning();
      return NextResponse.json(created, { status: 201 });
    }

    if (!body.name?.trim() || !body.content?.es || !body.content?.en) {
      return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(budgetPhases)
      .values({
        name: body.name.trim(),
        content: body.content,
        defaultPrice: body.defaultPrice ?? {},
        position: nextPosition,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create budget phase:", error);
    return NextResponse.json({ error: "Failed to create budget phase" }, { status: 500 });
  }
}
