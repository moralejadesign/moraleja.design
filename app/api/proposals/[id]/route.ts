import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { proposalVersions, proposals, type NewProposal } from "@/db/schema";
import { getAdminUserId } from "@/lib/admin-auth";
import { deleteSlideFiles, loadProposal, slideUploads } from "@/lib/proposal-data";

// Fields the editor may change; code and share settings are managed separately
const EDITABLE_FIELDS = [
  "clientName",
  "title",
  "language",
  "status",
  "intro",
  "showPastRounds",
  "internalNotes",
] as const satisfies readonly (keyof NewProposal)[];

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const notFound = () => NextResponse.json({ error: "Proposal not found" }, { status: 404 });

/** The proposal with every round and comment. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserId())) return unauthorized();

  try {
    const { id } = await params;
    const proposal = await loadProposal(parseInt(id, 10));
    return proposal ? NextResponse.json(proposal) : notFound();
  } catch (error) {
    console.error("Failed to fetch proposal:", error);
    return NextResponse.json({ error: "Failed to fetch proposal" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserId())) return unauthorized();

  try {
    const { id } = await params;
    const proposalId = parseInt(id, 10);
    const body = await request.json();

    const changes: Partial<NewProposal> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) (changes as Record<string, unknown>)[field] = body[field];
    }

    // Which round the client sees; showing a new round sends it for review again
    if ("currentVersionId" in body) {
      const [version] = await db
        .select({ id: proposalVersions.id })
        .from(proposalVersions)
        .where(and(eq(proposalVersions.id, Number(body.currentVersionId)), eq(proposalVersions.proposalId, proposalId)));
      if (!version) return NextResponse.json({ error: "Round not found" }, { status: 400 });
      changes.currentVersionId = version.id;
      changes.status = "sent";
    }

    const [updated] = await db
      .update(proposals)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(proposals.id, proposalId))
      .returning();

    return updated ? NextResponse.json(updated) : notFound();
  } catch (error) {
    console.error("Failed to update proposal:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserId())) return unauthorized();

  try {
    const { id } = await params;
    const proposalId = parseInt(id, 10);
    const versions = await db.select().from(proposalVersions).where(eq(proposalVersions.proposalId, proposalId));

    // Rounds and comments go with it (on delete cascade)
    const [deleted] = await db.delete(proposals).where(eq(proposals.id, proposalId)).returning();
    if (!deleted) return notFound();

    await deleteSlideFiles(versions.flatMap((v) => slideUploads(v.slides)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete proposal:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
}
