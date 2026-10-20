import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";
import { shareChanges, type ShareAction } from "@/lib/budget-share";

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
    const briefingId = parseInt(id, 10);
    const { action } = (await request.json()) as { action: ShareAction };

    const [briefing] = await db.select().from(briefings).where(eq(briefings.id, briefingId));
    if (!briefing) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
    }

    const changes = shareChanges(action, briefing);
    if (!changes) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const [updated] = await db
      .update(briefings)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(briefings.id, briefingId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update briefing link:", error);
    return NextResponse.json({ error: "Failed to update briefing link" }, { status: 500 });
  }
}
