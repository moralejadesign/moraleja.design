import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefingQuestions } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { STARTER_QUESTIONS } from "@/lib/briefings";

export async function GET() {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db
      .select()
      .from(briefingQuestions)
      .orderBy(asc(briefingQuestions.position), asc(briefingQuestions.id));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch briefing questions:", error);
    return NextResponse.json({ error: "Failed to fetch briefing questions" }, { status: 500 });
  }
}

/** Creates one question, or loads the starter library with { starter: true }. */
export async function POST(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const [maxResult] = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${briefingQuestions.position}), -1)` })
      .from(briefingQuestions);
    const nextPosition = (maxResult?.maxPos ?? -1) + 1;

    // Adds only the starter questions not already in the library (matched by Spanish title)
    if (body.starter) {
      const existing = await db
        .select({ content: briefingQuestions.content })
        .from(briefingQuestions);
      const titles = new Set(existing.map((q) => q.content.es.title.trim()));
      const missing = STARTER_QUESTIONS.filter((q) => !titles.has(q.content.es.title.trim()));
      if (!missing.length) return NextResponse.json([], { status: 200 });

      const created = await db
        .insert(briefingQuestions)
        .values(missing.map((question, i) => ({ ...question, position: nextPosition + i })))
        .returning();
      return NextResponse.json(created, { status: 201 });
    }

    if (!body.topic || !body.type || !body.content?.es || !body.content?.en) {
      return NextResponse.json({ error: "Topic, type and content are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(briefingQuestions)
      .values({
        topic: body.topic,
        type: body.type,
        required: !!body.required,
        content: body.content,
        position: nextPosition,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create briefing question:", error);
    return NextResponse.json({ error: "Failed to create briefing question" }, { status: 500 });
  }
}
