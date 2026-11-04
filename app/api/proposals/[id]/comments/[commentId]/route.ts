import { NextResponse } from "next/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { proposalComments, proposalVersions } from "@/db/schema";
import { getAdminUserId } from "@/lib/admin-auth";
import { toViewerComment } from "@/lib/proposals";

type Params = { params: Promise<{ id: string; commentId: string }> };

/** The comment, if it belongs to one of this proposal's rounds. */
async function findComment(proposalId: number, commentId: number) {
  const versionIds = db
    .select({ id: proposalVersions.id })
    .from(proposalVersions)
    .where(eq(proposalVersions.proposalId, proposalId));
  const [comment] = await db
    .select()
    .from(proposalComments)
    .where(and(eq(proposalComments.id, commentId), inArray(proposalComments.versionId, versionIds)));
  return comment;
}

/** Marks a thread resolved or open again. */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, commentId } = await params;
    const comment = await findComment(parseInt(id, 10), parseInt(commentId, 10));
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    const { resolved } = (await request.json()) as { resolved: boolean };
    const [updated] = await db
      .update(proposalComments)
      .set({ resolvedAt: resolved ? new Date() : null })
      .where(eq(proposalComments.id, comment.id))
      .returning();
    return NextResponse.json(toViewerComment(updated));
  } catch (error) {
    console.error("Failed to update comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

/** Deletes a comment; deleting the first one of a thread takes its replies too. */
export async function DELETE(request: Request, { params }: Params) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, commentId } = await params;
    const comment = await findComment(parseInt(id, 10), parseInt(commentId, 10));
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    await db
      .delete(proposalComments)
      .where(or(eq(proposalComments.id, comment.id), eq(proposalComments.parentId, comment.id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
