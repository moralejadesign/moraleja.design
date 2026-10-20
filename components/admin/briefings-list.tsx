"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Briefing, BriefingStatus } from "@/db/schema";
import { BRIEFING_STATUSES, answeredCount } from "@/lib/briefings";
import { BRIEFING_STATUS_STYLES } from "./briefing-question-fields";

async function fetchBriefings(): Promise<Briefing[]> {
  const res = await fetch("/api/briefings");
  if (!res.ok) throw new Error("Failed to fetch briefings");
  return res.json();
}

async function deleteBriefing(id: number): Promise<void> {
  const res = await fetch(`/api/briefings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete briefing");
}

async function updateStatus(id: number, status: BriefingStatus): Promise<void> {
  const res = await fetch(`/api/briefings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update briefing");
}

export function BriefingsList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<BriefingStatus | "all">("all");

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["briefings"],
    queryFn: fetchBriefings,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBriefing,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["briefings"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BriefingStatus }) => updateStatus(id, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["briefings"] }),
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
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load briefings. Please try again.
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No briefings yet</p>
        <Link
          href="/admin/briefings/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create your first briefing
        </Link>
      </div>
    );
  }

  const visible = filter === "all" ? items : items.filter((b) => b.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...BRIEFING_STATUSES.map((s) => s.value)] as const).map((value) => {
          const count = value === "all" ? items.length : items.filter((b) => b.status === value).length;
          const label = value === "all" ? "all" : BRIEFING_STATUSES.find((s) => s.value === value)!.label;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1 text-sm border transition-colors capitalize ${
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
        {visible.map((item) => {
          const answered = answeredCount(item);
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-colors"
            >
              <Link href={`/admin/briefings/${item.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{item.clientName}</h3>
                  <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs uppercase">
                    {item.language}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.code} · {item.questions.length}{" "}
                  {item.questions.length === 1 ? "question" : "questions"}
                </p>
              </Link>

              <div className="text-right shrink-0 tabular-nums text-sm text-muted-foreground">
                {answered}/{item.questions.length} answered
              </div>

              <select
                value={item.status}
                onChange={(e) =>
                  statusMutation.mutate({ id: item.id, status: e.target.value as BriefingStatus })
                }
                className={`px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-foreground/20 ${BRIEFING_STATUS_STYLES[item.status]}`}
                aria-label="Status"
              >
                {BRIEFING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/briefings/${item.id}`}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete the ${item.clientName} briefing (${item.code}) and its answers?`)) {
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
          );
        })}
      </div>
    </div>
  );
}
