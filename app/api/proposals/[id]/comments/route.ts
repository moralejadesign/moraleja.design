import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { proposalComments, proposalVersions } from "@/db/schema";
import { getAdminUserId } from "@/lib/admin-auth";
import { COMMENT_MAX_LENGTH, VIEWER_COPY, toViewerComment } from "@/lib/proposals";

/** Your own comment or reply; the client sees it signed as the studio. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const text = String(body.body ?? "").trim().slice(0, COMMENT_MAX_LENGTH);
    if (!text) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

    const [version] = await db
      .select()
      .from(proposalVersions)
      .where(and(eq(proposalVersions.id, Number(body.versionId)), eq(proposalVersions.proposalId, parseInt(id, 10))));
    if (!version) return NextResponse.json({ error: "Round not found" }, { status: 404 });
    if (!version.slides.some((s) => s.id === body.slideId)) {
      return NextResponse.json({ error: "Slide not found" }, { status: 400 });
    }

    let parentId: number | null = null;
    if (body.parentId) {
      const [parent] = await db
        .select()
        .from(proposalComments)
        .where(and(eq(proposalComments.id, Number(body.parentId)), eq(proposalComments.versionId, version.id)));
      if (!parent) return NextResponse.json({ error: "Comment not found" }, { status: 400 });
      parentId = parent.parentId ?? parent.id;
    }

    const pinned = parentId === null && typeof body.x === "number" && typeof body.y === "number";
    const [created] = await db
      .insert(proposalComments)
      .values({
        versionId: version.id,
        slideId: body.slideId,
        parentId,
        authorName: VIEWER_COPY.es.studio,
        isAdmin: true,
        body: text,
        x: pinned ? Math.min(1, Math.max(0, body.x)) : null,
        y: pinned ? Math.min(1, Math.max(0, body.y)) : null,
      })
      .returning();
    return NextResponse.json(toViewerComment(created), { status: 201 });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
