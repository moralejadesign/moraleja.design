"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import type { ProposalStatus } from "@/db/schema";
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_STYLES, roundLabel, type ProposalListItem } from "@/lib/proposals";

async function fetchProposals(): Promise<ProposalListItem[]> {
  const res = await fetch("/api/proposals");
  if (!res.ok) throw new Error("Failed to fetch proposals");
  return res.json();
}

async function deleteProposal(id: number) {
  const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete proposal");
}

async function updateStatus(id: number, status: ProposalStatus) {
  const res = await fetch(`/api/proposals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update proposal");
}

export function ProposalsList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ProposalStatus | "all">("all");
  const { data: items, isLoading, error } = useQuery({ queryKey: ["proposals"], queryFn: fetchProposals });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["proposals"] });
  const deleteMutation = useMutation({ mutationFn: deleteProposal, onSettled: invalidate });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProposalStatus }) => updateStatus(id, status),
    onSettled: invalidate,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load proposals. Please try again.</div>;
  }

  if (!items?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No proposals yet</p>
        <Link
          href="/admin/proposals/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create your first proposal
        </Link>
      </div>
    );
  }

  const visible = filter === "all" ? items : items.filter((p) => p.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...PROPOSAL_STATUSES.map((s) => s.value)] as const).map((value) => {
          const count = value === "all" ? items.length : items.filter((p) => p.status === value).length;
          const label = value === "all" ? "All" : PROPOSAL_STATUSES.find((s) => s.value === value)!.label;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1 text-sm border transition-colors ${
                filter === value
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {label} <span className="text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {visible.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-colors"
          >
            <Link href={`/admin/proposals/${item.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{item.title || item.clientName}</h3>
                <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs uppercase">{item.language}</span>
                {item.currentRound && (
                  <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs">
                    {roundLabel(item.currentRound)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {item.code} · {item.clientName} · {item.slides} {item.slides === 1 ? "slide" : "slides"}
              </p>
            </Link>

            <div
              className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground tabular-nums"
              title={`${item.comments} comments in the current round, ${item.unresolved} unresolved`}
            >
              <MessageSquare className="h-4 w-4" />
              {item.unresolved > 0 ? (
                <span className="text-foreground">{item.unresolved} open</span>
              ) : (
                item.comments
              )}
            </div>

            <select
              value={item.status}
              onChange={(e) => statusMutation.mutate({ id: item.id, status: e.target.value as ProposalStatus })}
              className={`px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-foreground/20 ${PROPOSAL_STATUS_STYLES[item.status]}`}
              aria-label="Status"
            >
              {PROPOSAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <Link
                href={`/admin/proposals/${item.id}`}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Delete the ${item.clientName} proposal (${item.code}) with all its rounds, slides and comments?`)) {
                    deleteMutation.mutate(item.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
