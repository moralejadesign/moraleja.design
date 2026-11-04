import { cookies } from "next/headers";
import { and, asc, eq, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import {
  proposalComments,
  proposalVersions,
  proposals,
  type Proposal,
  type ProposalSlide,
  type ProposalVersion,
} from "@/db/schema";
import { accessCookieName, hasValidAccess } from "./budget-share";
import { isProposalUpload, type ProposalWithRounds } from "./proposals";

// Server-only: data loading for the admin API and the client link (/r/[token]).
// Kept out of the "use server" actions file so the browser can't call these directly.

export type { ProposalWithRounds } from "./proposals";

export async function loadProposal(id: number): Promise<ProposalWithRounds | null> {
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
  if (!proposal) return null;

  const versions = await db
    .select()
    .from(proposalVersions)
    .where(eq(proposalVersions.proposalId, id))
    .orderBy(asc(proposalVersions.number));
  const comments = versions.length
    ? await db
        .select()
        .from(proposalComments)
        .where(inArray(proposalComments.versionId, versions.map((v) => v.id)))
        .orderBy(asc(proposalComments.id))
    : [];

  return { ...proposal, versions, comments };
}

export async function findProposal(token: string) {
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.shareToken, token), eq(proposals.shareEnabled, true)));
  return proposal;
}

/** The proposal, if this browser entered the PIN and the link is still on. */
export async function authorizedProposal(token: string) {
  const proposal = await findProposal(token);
  if (!proposal?.sharePin) return null;
  const cookie = (await cookies()).get(accessCookieName(token, "proposal"))?.value;
  return hasValidAccess(cookie, token, proposal.sharePin) ? proposal : null;
}

/** Rounds the client may open: the current one, plus earlier ones if you allow it. */
export function visibleRounds(proposal: Proposal, versions: ProposalVersion[]) {
  const current = versions.find((v) => v.id === proposal.currentVersionId);
  if (!current) return [];
  return proposal.showPastRounds ? versions.filter((v) => v.number <= current.number) : [current];
}

/** A round the client can see, with whether they may still comment on it. */
export async function clientRound(proposal: Proposal, versionId: number) {
  const versions = await db.select().from(proposalVersions).where(eq(proposalVersions.proposalId, proposal.id));
  const round = visibleRounds(proposal, versions).find((v) => v.id === versionId);
  if (!round) return null;
  return { round, writable: round.id === proposal.currentVersionId && !round.decision };
}

/** Slide images of the given rounds that live in our Blob store. */
export function slideUploads(slides: ProposalSlide[]) {
  return slides.map((s) => s.url).filter(isProposalUpload);
}

/** Deletes slide images; a failure is logged and never undoes the database change. */
export async function deleteSlideFiles(urls: string[]) {
  if (!urls.length) return;
  await del(urls).catch((error) => console.error("Failed to delete proposal files:", error));
}
