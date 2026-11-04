import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { proposalVersions, proposals, type NewProposalVersion, type ProposalSlide } from "@/db/schema";
import { getAdminUserId } from "@/lib/admin-auth";
import { deleteSlideFiles, slideUploads } from "@/lib/proposal-data";

type Params = { params: Promise<{ id: string; versionId: string }> };

function cleanSlides(input: unknown): ProposalSlide[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((s) => s && typeof s.id === "string" && typeof s.url === "string")
    .map((s) => ({
      id: String(s.id).slice(0, 32),
      url: String(s.url),
      width: Number(s.width) || 1920,
      height: Number(s.height) || 1080,
      title: typeof s.title === "string" ? s.title.slice(0, 200) : "",
    }));
}

async function findVersion(proposalId: number, versionId: number) {
  const [version] = await db
    .select()
    .from(proposalVersions)
    .where(and(eq(proposalVersions.id, versionId), eq(proposalVersions.proposalId, proposalId)));
  return version;
}

/** Slides and note of a round; `reopen` clears the client's decision so they can review again. */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, versionId } = await params;
    const proposalId = parseInt(id, 10);
    const version = await findVersion(proposalId, parseInt(versionId, 10));
    if (!version) return NextResponse.json({ error: "Round not found" }, { status: 404 });

    const body = await request.json();
    const changes: Partial<NewProposalVersion> = {};
    if ("note" in body) changes.note = String(body.note ?? "");
    if ("slides" in body) changes.slides = cleanSlides(body.slides);
    if (body.reopen) {
      changes.decision = null;
      changes.decisionNote = null;
      changes.decidedBy = null;
      changes.decidedAt = null;
    }

    const [updated] = await db
      .update(proposalVersions)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(proposalVersions.id, version.id))
      .returning();

    // The first round with slides becomes the one the client sees
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
    if (proposal && proposal.currentVersionId === null && updated.slides.length > 0) {
      await db.update(proposals).set({ currentVersionId: updated.id, updatedAt: new Date() }).where(eq(proposals.id, proposalId));
    }
    if (body.reopen && proposal?.currentVersionId === updated.id) {
      await db.update(proposals).set({ status: "in_review", updatedAt: new Date() }).where(eq(proposals.id, proposalId));
    }

    // Images removed from the round are deleted from storage
    if (changes.slides) {
      const kept = new Set(changes.slides.map((s) => s.url));
      await deleteSlideFiles(slideUploads(version.slides).filter((url) => !kept.has(url)));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update round:", error);
    return NextResponse.json({ error: "Failed to update round" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, versionId } = await params;
    const proposalId = parseInt(id, 10);
    const version = await findVersion(proposalId, parseInt(versionId, 10));
    if (!version) return NextResponse.json({ error: "Round not found" }, { status: 404 });

    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
    if (proposal?.currentVersionId === version.id) {
      return NextResponse.json({ error: "Show another round to the client before deleting this one" }, { status: 400 });
    }

    await db.delete(proposalVersions).where(eq(proposalVersions.id, version.id));
    await deleteSlideFiles(slideUploads(version.slides));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete round:", error);
    return NextResponse.json({ error: "Failed to delete round" }, { status: 500 });
  }
}
