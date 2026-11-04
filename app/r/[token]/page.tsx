import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { proposalComments, proposalVersions, proposals } from "@/db/schema";
import { authorizedProposal, findProposal, visibleRounds } from "@/lib/proposal-data";
import { proposalHeading, toViewerComment, toViewerRound } from "@/lib/proposals";
import { PinForm } from "@/components/pin-form";
import { ProposalViewer } from "@/components/proposal-viewer";
import { verifyPin, addComment, deleteComment, listComments, setReaction, submitDecision } from "./actions";

export const metadata: Metadata = {
  title: "Propuesta",
  robots: { index: false, follow: false },
};

export default function SharedProposalPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] text-white">
      <Suspense fallback={null}>
        <SharedProposal params={params} />
      </Suspense>
    </main>
  );
}

async function SharedProposal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findProposal(token);
  if (!found?.sharePin) notFound();

  const proposal = await authorizedProposal(token);
  if (!proposal) {
    return <PinForm verify={verifyPin.bind(null, token)} language={found.language} kind="proposal" />;
  }

  // Count client visits, not your own checks while signed in to the admin
  const { userId } = await auth();
  if (!userId) {
    after(() =>
      db
        .update(proposals)
        .set({
          shareViewCount: sql`${proposals.shareViewCount} + 1`,
          shareLastViewedAt: new Date(),
        })
        .where(eq(proposals.id, proposal.id))
    );
  }

  const versions = await db
    .select()
    .from(proposalVersions)
    .where(eq(proposalVersions.proposalId, proposal.id))
    .orderBy(asc(proposalVersions.number));
  const rounds = visibleRounds(proposal, versions);
  const comments = rounds.length
    ? await db
        .select()
        .from(proposalComments)
        .where(inArray(proposalComments.versionId, rounds.map((r) => r.id)))
        .orderBy(asc(proposalComments.id))
    : [];

  // Only what the client needs; internal notes and author keys never leave the server
  return (
    <ProposalViewer
      mode="client"
      heading={proposalHeading(proposal)}
      clientName={proposal.clientName}
      intro={proposal.intro ?? ""}
      language={proposal.language}
      rounds={rounds.map(toViewerRound)}
      currentRoundId={proposal.currentVersionId}
      initialComments={comments.map((c) => toViewerComment(c, null))}
      actions={{
        list: listComments.bind(null, token),
        add: addComment.bind(null, token),
        remove: deleteComment.bind(null, token),
        react: setReaction.bind(null, token),
        decide: submitDecision.bind(null, token),
      }}
    />
  );
}
