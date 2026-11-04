"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ProposalEditor, fetchProposal } from "@/components/admin/proposal-editor";

export default function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => fetchProposal(Number(id)),
    // The editor keeps its own state and refreshes when you open the feedback
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Proposal not found</p>
      </div>
    );
  }

  return <ProposalEditor key={proposal.id} proposal={proposal} />;
}
