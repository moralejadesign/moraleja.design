import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefingQuestions, briefingTemplates } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { STARTER_TEMPLATES } from "@/lib/briefings";

export async function GET() {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db
      .select()
      .from(briefingTemplates)
      .orderBy(asc(briefingTemplates.position), asc(briefingTemplates.id));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch briefing templates:", error);
    return NextResponse.json({ error: "Failed to fetch briefing templates" }, { status: 500 });
  }
}

/** Creates one template, or the Moraleja starters with { starter: true } (matched to the library). */
export async function POST(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const [maxResult] = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${briefingTemplates.position}), -1)` })
      .from(briefingTemplates);
    const nextPosition = (maxResult?.maxPos ?? -1) + 1;

    if (body.starter) {
      const library = await db
        .select({ id: briefingQuestions.id, content: briefingQuestions.content })
        .from(briefingQuestions)
        .orderBy(asc(briefingQuestions.position), asc(briefingQuestions.id));
      const title = (q: (typeof library)[number]) => q.content.es.title.trim();

      const created = await db
        .insert(briefingTemplates)
        .values(
          STARTER_TEMPLATES.map((template, i) => ({
            name: template.name,
            description: template.description,
            questionIds: library
              .filter((q) =>
                template.include ? template.include.includes(title(q)) : !template.exclude?.includes(title(q))
              )
              .map((q) => q.id),
            position: nextPosition + i,
          }))
        )
        .returning();
      return NextResponse.json(created, { status: 201 });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(briefingTemplates)
      .values({
        name: body.name.trim(),
        description: body.description ?? null,
        questionIds: Array.isArray(body.questionIds) ? body.questionIds : [],
        position: nextPosition,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create briefing template:", error);
    return NextResponse.json({ error: "Failed to create briefing template" }, { status: 500 });
  }
}
