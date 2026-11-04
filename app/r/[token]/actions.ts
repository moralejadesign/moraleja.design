"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, count, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { proposalComments, proposalVersions, proposals, type ProposalReaction } from "@/db/schema";
import {
  ACCESS_DAYS,
  MAX_PIN_ATTEMPTS,
  PIN_LOCK_MINUTES,
  accessCookieName,
  pinMatches,
  signAccess,
} from "@/lib/budget-share";
import type { PinState } from "@/lib/budget-share-config";
import { authorizedProposal, clientRound, findProposal } from "@/lib/proposal-data";
import {
  AUTHOR_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
  MAX_COMMENTS_PER_MINUTE,
  MAX_COMMENTS_PER_ROUND,
  toViewerComment,
  toViewerRound,
  type ViewerComment,
  type ViewerRound,
} from "@/lib/proposals";

export async function verifyPin(token: string, _prev: PinState, formData: FormData): Promise<PinState> {
  const pin = String(formData.get("pin") ?? "");

  const proposal = await findProposal(token);
  if (!proposal?.sharePin) redirect(`/r/${token}`);

  if (proposal.shareLockedUntil && proposal.shareLockedUntil > new Date()) {
    return { error: "locked" };
  }

  if (!pinMatches(pin, proposal.sharePin)) {
    const [updated] = await db
      .update(proposals)
      .set({ shareFailedAttempts: sql`${proposals.shareFailedAttempts} + 1` })
      .where(eq(proposals.id, proposal.id))
      .returning({ attempts: proposals.shareFailedAttempts });

    if (updated.attempts >= MAX_PIN_ATTEMPTS) {
      await db
        .update(proposals)
        .set({
          shareFailedAttempts: 0,
          shareLockedUntil: new Date(Date.now() + PIN_LOCK_MINUTES * 60_000),
        })
        .where(eq(proposals.id, proposal.id));
      return { error: "locked" };
    }
    return { error: "wrong", attemptsLeft: MAX_PIN_ATTEMPTS - updated.attempts };
  }

  if (proposal.shareFailedAttempts > 0) {
    await db.update(proposals).set({ shareFailedAttempts: 0 }).where(eq(proposals.id, proposal.id));
  }

  (await cookies()).set(accessCookieName(token, "proposal"), signAccess(token, proposal.sharePin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/r/${token}`,
    maxAge: ACCESS_DAYS * 24 * 60 * 60,
  });
  redirect(`/r/${token}`);
}

type Fail = { ok: false; error: "unauthorized" | "locked" | "invalid" | "limit" | "failed" };

const cleanKey = (key: unknown) => (typeof key === "string" ? key.slice(0, 64) : "");
const cleanName = (name: unknown) => (typeof name === "string" ? name.trim().slice(0, AUTHOR_MAX_LENGTH) : "");

/** Comments of a round, marked with which ones this reviewer wrote. */
export async function listComments(
  token: string,
  versionId: number,
  authorKey: string
): Promise<{ ok: true; comments: ViewerComment[]; round: ViewerRound } | Fail> {
  const proposal = await authorizedProposal(token);
  if (!proposal) return { ok: false, error: "unauthorized" };
  const access = await clientRound(proposal, versionId);
  if (!access) return { ok: false, error: "invalid" };

  const rows = await db
    .select()
    .from(proposalComments)
    .where(eq(proposalComments.versionId, versionId))
    .orderBy(asc(proposalComments.id));
  const key = cleanKey(authorKey);
  return { ok: true, comments: rows.map((c) => toViewerComment(c, key || null)), round: toViewerRound(access.round) };
}

export async function addComment(
  token: string,
  input: {
    versionId: number;
    slideId: string;
    parentId?: number | null;
    body: string;
    x?: number | null;
    y?: number | null;
    authorName: string;
    authorKey: string;
  }
): Promise<{ ok: true; comment: ViewerComment } | Fail> {
  const proposal = await authorizedProposal(token);
  if (!proposal) return { ok: false, error: "unauthorized" };
  const access = await clientRound(proposal, Number(input.versionId));
  if (!access) return { ok: false, error: "invalid" };
  if (!access.writable) return { ok: false, error: "locked" };

  const body = String(input.body ?? "").trim().slice(0, COMMENT_MAX_LENGTH);
  const authorName = cleanName(input.authorName);
  const authorKey = cleanKey(input.authorKey);
  if (!body || !authorName || !authorKey) return { ok: false, error: "invalid" };
  if (!access.round.slides.some((s) => s.id === input.slideId)) return { ok: false, error: "invalid" };

  // Keeps a leaked link from filling the round with junk
  const [{ total }] = await db
    .select({ total: count() })
    .from(proposalComments)
    .where(eq(proposalComments.versionId, access.round.id));
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(proposalComments)
    .where(
      and(
        eq(proposalComments.versionId, access.round.id),
        eq(proposalComments.authorKey, authorKey),
        gt(proposalComments.createdAt, new Date(Date.now() - 60_000))
      )
    );
  if (total >= MAX_COMMENTS_PER_ROUND || recent >= MAX_COMMENTS_PER_MINUTE) return { ok: false, error: "limit" };

  let parentId: number | null = null;
  if (input.parentId) {
    const [parent] = await db
      .select()
      .from(proposalComments)
      .where(and(eq(proposalComments.id, Number(input.parentId)), eq(proposalComments.versionId, access.round.id)));
    if (!parent) return { ok: false, error: "invalid" };
    parentId = parent.parentId ?? parent.id;
  }

  const pinned =
    parentId === null &&
    typeof input.x === "number" &&
    typeof input.y === "number" &&
    Number.isFinite(input.x) &&
    Number.isFinite(input.y);

  try {
    const [created] = await db
      .insert(proposalComments)
      .values({
        versionId: access.round.id,
        slideId: input.slideId,
        parentId,
        authorName,
        authorKey,
        body,
        x: pinned ? Math.min(1, Math.max(0, input.x!)) : null,
        y: pinned ? Math.min(1, Math.max(0, input.y!)) : null,
      })
      .returning();

    // The first comment moves a sent proposal into review
    if (proposal.status === "draft" || proposal.status === "sent") {
      await db.update(proposals).set({ status: "in_review", updatedAt: new Date() }).where(eq(proposals.id, proposal.id));
    }
    return { ok: true, comment: toViewerComment(created, authorKey) };
  } catch (error) {
    console.error("Failed to add proposal comment:", error);
    return { ok: false, error: "failed" };
  }
}

/** A reviewer deletes one of their own comments (and its replies) while the round is open. */
export async function deleteComment(token: string, commentId: number, authorKey: string): Promise<{ ok: true } | Fail> {
  const proposal = await authorizedProposal(token);
  if (!proposal?.currentVersionId) return { ok: false, error: "unauthorized" };
  const key = cleanKey(authorKey);
  if (!key) return { ok: false, error: "invalid" };

  const [comment] = await db
    .select()
    .from(proposalComments)
    .where(
      and(
        eq(proposalComments.id, Number(commentId)),
        eq(proposalComments.authorKey, key),
        eq(proposalComments.versionId, proposal.currentVersionId)
      )
    );
  if (!comment) return { ok: false, error: "invalid" };
  const access = await clientRound(proposal, comment.versionId);
  if (!access?.writable) return { ok: false, error: "locked" };

  await db
    .delete(proposalComments)
    .where(or(eq(proposalComments.id, comment.id), eq(proposalComments.parentId, comment.id)));
  return { ok: true };
}

/** Quick per-slide verdict; sending the same one again clears it. */
export async function setReaction(
  token: string,
  input: { versionId: number; slideId: string; reaction: ProposalReaction | null; authorName: string }
): Promise<{ ok: true; reactions: ViewerRound["reactions"] } | Fail> {
  const proposal = await authorizedProposal(token);
  if (!proposal) return { ok: false, error: "unauthorized" };
  const access = await clientRound(proposal, Number(input.versionId));
  if (!access) return { ok: false, error: "invalid" };
  if (!access.writable) return { ok: false, error: "locked" };

  const name = cleanName(input.authorName);
  const slide = access.round.slides.find((s) => s.id === input.slideId);
  if (!name || !slide) return { ok: false, error: "invalid" };
  if (input.reaction !== null && input.reaction !== "like" && input.reaction !== "changes") {
    return { ok: false, error: "invalid" };
  }

  // Changes only this reviewer's entry, so two reviewers reacting at once don't overwrite each other
  const slideKey = `{${JSON.stringify(slide.id)}}`;
  const ownEntry = input.reaction
    ? sql`coalesce(${proposalVersions.reactions} -> ${slide.id}::text, '{}'::jsonb) || jsonb_build_object(${name}::text, ${input.reaction}::text)`
    : sql`coalesce(${proposalVersions.reactions} -> ${slide.id}::text, '{}'::jsonb) - ${name}::text`;
  const [updated] = await db
    .update(proposalVersions)
    .set({ reactions: sql`jsonb_set(${proposalVersions.reactions}, ${slideKey}::text[], ${ownEntry})` })
    .where(eq(proposalVersions.id, access.round.id))
    .returning({ reactions: proposalVersions.reactions });

  return { ok: true, reactions: updated.reactions };
}

/** Closes the round: approved or changes requested. Comments stay; the round becomes read-only. */
export async function submitDecision(
  token: string,
  input: { versionId: number; decision: "approved" | "changes_requested"; note: string; authorName: string }
): Promise<{ ok: true; round: ViewerRound } | Fail> {
  const proposal = await authorizedProposal(token);
  if (!proposal) return { ok: false, error: "unauthorized" };
  const access = await clientRound(proposal, Number(input.versionId));
  if (!access) return { ok: false, error: "invalid" };
  if (!access.writable) return { ok: false, error: "locked" };

  const name = cleanName(input.authorName);
  if (!name || (input.decision !== "approved" && input.decision !== "changes_requested")) {
    return { ok: false, error: "invalid" };
  }

  try {
    const now = new Date();
    const [updated] = await db
      .update(proposalVersions)
      .set({
        decision: input.decision,
        decisionNote: String(input.note ?? "").trim().slice(0, COMMENT_MAX_LENGTH) || null,
        decidedBy: name,
        decidedAt: now,
        updatedAt: now,
      })
      // Only the first decision counts if two reviewers send at once
      .where(and(eq(proposalVersions.id, access.round.id), isNull(proposalVersions.decision)))
      .returning();
    if (!updated) return { ok: false, error: "locked" };

    await db
      .update(proposals)
      .set({ status: input.decision, updatedAt: now })
      .where(and(eq(proposals.id, proposal.id), inArray(proposals.currentVersionId, [access.round.id])));
    return { ok: true, round: toViewerRound(updated) };
  } catch (error) {
    console.error("Failed to submit proposal decision:", error);
    return { ok: false, error: "failed" };
  }
}
