import { NextResponse } from "next/server";
import { db } from "@/db";
import { proposals } from "@/db/schema";
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
    const proposalId = parseInt(id, 10);
    const { action } = (await request.json()) as { action: ShareAction };

    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const changes = shareChanges(action, proposal);
    if (!changes) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const [updated] = await db
      .update(proposals)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(proposals.id, proposalId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update proposal link:", error);
    return NextResponse.json({ error: "Failed to update proposal link" }, { status: 500 });
  }
}
