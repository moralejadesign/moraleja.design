"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, KeyRound, Link2, Loader2, Lock, RefreshCw } from "lucide-react";
import type { Budget } from "@/db/schema";

type ShareAction = "create" | "enable" | "disable" | "new-pin" | "new-link" | "unlock";

async function updateShare({ id, action }: { id: number; action: ShareAction }): Promise<Budget> {
  const res = await fetch(`/api/budgets/${id}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("Failed to update link");
  return res.json();
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      }}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border hover:bg-muted transition-colors shrink-0"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BudgetSharePanel({ budget: initial }: { budget: Budget }) {
  const queryClient = useQueryClient();
  const [budget, setBudget] = useState(initial);
  const [origin, setOrigin] = useState("");
  // Read the clock after mount; Cache Components can't prerender `new Date()`
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => setNow(Date.now()), [budget]);

  const mutation = useMutation({
    mutationFn: updateShare,
    onSuccess: (updated) => {
      setBudget(updated);
      queryClient.setQueryData(["budget", String(updated.id)], updated);
    },
  });

  const run = (action: ShareAction) => mutation.mutate({ id: budget.id, action });
  const link = budget.shareToken ? `${origin}/b/${budget.shareToken}` : "";
  const isLocked =
    now !== null && budget.shareLockedUntil !== null && new Date(budget.shareLockedUntil).getTime() > now;

  if (!budget.shareToken || !budget.sharePin) {
    return (
      <div className="space-y-3 p-6 border border-border">
        <h2 className="font-semibold">Client link</h2>
        <p className="text-sm text-muted-foreground">
          A private link the client opens with a 6-digit PIN. Send the link and the PIN through
          different channels, e.g. the link by email and the PIN by WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => run("create")}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Create client link
        </button>
        {mutation.isError && <p className="text-sm text-destructive">Couldn&apos;t create the link.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 border border-border">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Client link</h2>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <input
            type="checkbox"
            checked={budget.shareEnabled}
            onChange={(e) => run(e.target.checked ? "enable" : "disable")}
            disabled={mutation.isPending}
            className="w-4 h-4"
          />
          {budget.shareEnabled ? "Active" : "Off"}
        </label>
      </div>

      <div className={budget.shareEnabled ? "space-y-4" : "space-y-4 opacity-50"}>
        <div>
          <span className="block text-sm font-medium text-muted-foreground mb-1.5">Link</span>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="w-full min-w-0 px-3 py-2 bg-muted/30 border border-border text-sm focus:outline-none"
            />
            <CopyButton value={link} label="Copy" />
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-border hover:bg-muted transition-colors shrink-0"
              title="Open as the client sees it"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-muted-foreground mb-1.5">PIN</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 bg-muted/30 border border-border text-lg tracking-[0.4em] tabular-nums">
              {budget.sharePin}
            </span>
            <CopyButton value={budget.sharePin} label="Copy PIN" />
            <button
              type="button"
              onClick={() => run("new-pin")}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50"
              title="The client will need the new PIN"
            >
              <KeyRound className="h-4 w-4" />
              New PIN
            </button>
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-red-500/10 text-sm text-red-400">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Locked after too many wrong PINs, until {formatDateTime(budget.shareLockedUntil!)}
          </span>
          <button type="button" onClick={() => run("unlock")} className="underline hover:no-underline">
            Unlock now
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-sm text-muted-foreground">
          {budget.shareViewCount > 0 && budget.shareLastViewedAt
            ? `Opened ${budget.shareViewCount} ${budget.shareViewCount === 1 ? "time" : "times"} · last ${formatDateTime(budget.shareLastViewedAt)}`
            : "Not opened yet"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Create a new link? The current link will stop working.")) run("new-link");
          }}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New link
        </button>
      </div>
    </div>
  );
}
