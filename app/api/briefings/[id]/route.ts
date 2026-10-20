import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefings, type BriefingLink, type NewBriefing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { getAdminUserId } from "@/lib/admin-auth";
import { isUploaded } from "@/lib/briefings";

// Fields the editor may change; code, answers and share settings are managed separately
const EDITABLE_FIELDS = [
  "clientName",
  "title",
  "language",
  "status",
  "intro",
  "questions",
  "answerNotes",
  "internalNotes",
] as const satisfies readonly (keyof NewBriefing)[];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const [item] = await db.select().from(briefings).where(eq(briefings.id, parseInt(id, 10)));

    if (!item) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch briefing:", error);
    return NextResponse.json({ error: "Failed to fetch briefing" }, { status: 500 });
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

    const changes: Partial<NewBriefing> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) (changes as Record<string, unknown>)[field] = body[field];
    }
    // Unlocks a submitted briefing so the client can edit their answers again
    if (body.reopen) {
      changes.submittedAt = null;
      changes.status = "in_progress";
    }

    const [updated] = await db
      .update(briefings)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(briefings.id, parseInt(id, 10)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update briefing:", error);
    return NextResponse.json({ error: "Failed to update briefing" }, { status: 500 });
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
      .delete(briefings)
      .where(eq(briefings.id, parseInt(id, 10)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
    }

    // Files the client uploaded go with the briefing; a failure here doesn't undo the delete
    const uploads = deleted.questions
      .filter((q) => q.type === "files")
      .flatMap((q) => (deleted.answers[q.id] as BriefingLink[] | undefined) ?? [])
      .filter(isUploaded)
      .map((file) => file.url);
    if (uploads.length) {
      await del(uploads).catch((error) => console.error("Failed to delete briefing files:", error));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete briefing:", error);
    return NextResponse.json({ error: "Failed to delete briefing" }, { status: 500 });
  }
}
