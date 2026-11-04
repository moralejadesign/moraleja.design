"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Cloud, Columns2, ExternalLink, Loader2, MessageSquare, Plus, Upload } from "lucide-react";
import type { Proposal, ProposalVersion } from "@/db/schema";
import {
  DEFAULT_INTRO,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_STYLES,
  proposalHeading,
  roundLabel,
  type ProposalWithRounds,
} from "@/lib/proposals";
import { ProposalSharePanel } from "./share-panel";
import { ProposalRound } from "./proposal-round";
import { ProposalFeedback } from "./proposal-feedback";
import { ProposalCompare } from "./proposal-compare";

type DetailsInput = Pick<
  Proposal,
  "clientName" | "title" | "language" | "status" | "intro" | "showPastRounds" | "internalNotes"
>;
type SaveStatus = "idle" | "saving" | "saved" | "error";
type Tab = "slides" | "feedback" | "compare";

const inputClass =
  "w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20";
const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

export async function fetchProposal(id: number): Promise<ProposalWithRounds> {
  const res = await fetch(`/api/proposals/${id}`);
  if (!res.ok) throw new Error("Failed to fetch proposal");
  return res.json();
}

/** Sends only changed fields, so a save never overwrites what the client changed (status). */
async function updateProposal({ id, data }: { id: number; data: Partial<DetailsInput> | { currentVersionId: number } }) {
  const res = await fetch(`/api/proposals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update proposal");
  return (await res.json()) as Proposal;
}

function toInput(p: Proposal): DetailsInput {
  return {
    clientName: p.clientName,
    title: p.title,
    language: p.language,
    status: p.status,
    intro: p.intro,
    showPastRounds: p.showPastRounds,
    internalNotes: p.internalNotes,
  };
}

export function ProposalEditor({ proposal: initial }: { proposal: ProposalWithRounds }) {
  const queryClient = useQueryClient();
  // Latest copy from the server: comments, decisions and status change outside this form
  const [proposal, setProposal] = useState(initial);
  const [formData, setFormData] = useState<DetailsInput>(() => toInput(initial));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [tab, setTab] = useState<Tab>(initial.comments.length ? "feedback" : "slides");
  const [roundId, setRoundId] = useState<number | null>(
    initial.currentVersionId ?? initial.versions.at(-1)?.id ?? null
  );
  const lastSaved = useRef(JSON.stringify(toInput(initial)));
  const hasChanges = JSON.stringify(formData) !== lastSaved.current;

  const cache = (fresh: ProposalWithRounds) => {
    setProposal(fresh);
    queryClient.setQueryData(["proposal", String(fresh.id)], fresh);
    queryClient.invalidateQueries({ queryKey: ["proposals"] });
  };

  // Takes comments and status from the server; local edits that aren't saved yet stay pending
  const syncFromServer = (fresh: ProposalWithRounds) => {
    cache(fresh);
    const saved = JSON.parse(lastSaved.current) as DetailsInput;
    if (formData.status === saved.status) {
      lastSaved.current = JSON.stringify({ ...saved, status: fresh.status });
      setFormData((prev) => ({ ...prev, status: fresh.status }));
    }
  };

  const refreshMutation = useMutation({ mutationFn: fetchProposal, onSuccess: syncFromServer });
  const refresh = () => refreshMutation.mutate(proposal.id);

  const updateMutation = useMutation({
    mutationFn: updateProposal,
    onMutate: () => setSaveStatus("saving"),
    onError: () => setSaveStatus("error"),
    onSuccess: (saved, { data }) => {
      lastSaved.current = JSON.stringify({ ...JSON.parse(lastSaved.current), ...data });
      cache({ ...proposal, ...saved });
      setSaveStatus("saved");
    },
  });

  // Autosave a second after the last change
  useEffect(() => {
    if (!hasChanges || updateMutation.isPending) return;
    const timeout = setTimeout(() => {
      const saved = JSON.parse(lastSaved.current) as DetailsInput;
      const changed = Object.fromEntries(
        Object.entries(formData).filter(
          ([key, value]) => JSON.stringify(value) !== JSON.stringify(saved[key as keyof DetailsInput])
        )
      ) as Partial<DetailsInput>;
      if (Object.keys(changed).length === 0) {
        lastSaved.current = JSON.stringify(formData);
        return;
      }
      updateMutation.mutate({ id: proposal.id, data: changed });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData, hasChanges, proposal.id, updateMutation]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timeout = setTimeout(() => setSaveStatus("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [saveStatus]);

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const update = <K extends keyof DetailsInput>(field: K, value: DetailsInput[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Swap an untouched default intro when the language changes
  const changeLanguage = (language: DetailsInput["language"]) =>
    setFormData((prev) => ({
      ...prev,
      language,
      intro: prev.intro === DEFAULT_INTRO[prev.language] ? DEFAULT_INTRO[language] : prev.intro,
    }));

  const newRoundMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/proposals/${proposal.id}/versions`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to create round");
      return (await res.json()) as ProposalVersion;
    },
    onSuccess: (version) => {
      cache({ ...proposal, versions: [...proposal.versions, version] });
      setRoundId(version.id);
      setTab("slides");
    },
  });

  const showRoundMutation = useMutation({
    mutationFn: (versionId: number) => updateProposal({ id: proposal.id, data: { currentVersionId: versionId } }),
    onSuccess: (saved) => syncFromServer({ ...proposal, ...saved }),
  });

  const deleteRoundMutation = useMutation({
    mutationFn: async (versionId: number) => {
      const res = await fetch(`/api/proposals/${proposal.id}/versions/${versionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to delete round");
      return versionId;
    },
    onSuccess: (versionId) => {
      const versions = proposal.versions.filter((v) => v.id !== versionId);
      cache({ ...proposal, versions, comments: proposal.comments.filter((c) => c.versionId !== versionId) });
      setRoundId(proposal.currentVersionId ?? versions.at(-1)?.id ?? null);
    },
  });

  const round = proposal.versions.find((v) => v.id === roundId) ?? proposal.versions.at(-1) ?? null;
  const openComments = proposal.comments.filter(
    (c) => c.versionId === proposal.currentVersionId && !c.parentId && !c.isAdmin && !c.resolvedAt
  ).length;
  const clientLink = proposal.shareToken && proposal.shareEnabled ? `/r/${proposal.shareToken}` : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/proposals" className="p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{proposalHeading(formData)}</h1>
          <p className="text-sm text-muted-foreground">
            {proposal.code}
            {proposal.currentVersionId &&
              ` · client sees ${roundLabel(proposal.versions.find((v) => v.id === proposal.currentVersionId)?.number ?? 1)}`}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs ${PROPOSAL_STATUS_STYLES[proposal.status]}`}>
          {PROPOSAL_STATUSES.find((s) => s.value === proposal.status)?.label}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {saveStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveStatus === "saved" && <Check className="h-4 w-4 text-green-500" />}
            {saveStatus === "idle" && !hasChanges && <Cloud className="h-4 w-4" />}
            {saveStatus === "error" ? <span className="text-destructive">Couldn&apos;t save</span> : hasChanges ? "Unsaved" : "Saved"}
          </span>
          {clientLink && (
            <a
              href={clientLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open as client
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(
          [
            { value: "slides", label: "Slides", icon: <Upload className="h-4 w-4" /> },
            {
              value: "feedback",
              label: openComments ? `Feedback · ${openComments} open` : "Feedback",
              icon: <MessageSquare className="h-4 w-4" />,
            },
            ...(proposal.versions.length > 1
              ? [{ value: "compare" as const, label: "Compare rounds", icon: <Columns2 className="h-4 w-4" /> }]
              : []),
          ] satisfies { value: Tab; label: string; icon: React.ReactNode }[]
        ).map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setTab(item.value);
              if (item.value !== "slides") refresh();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === item.value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === "feedback" && (
        <ProposalFeedback
          proposal={proposal}
          onRefresh={refresh}
          onFresh={syncFromServer}
          refreshing={refreshMutation.isPending}
        />
      )}

      {tab === "compare" && <ProposalCompare proposal={proposal} />}

      {tab === "slides" && (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
          {/* Rounds */}
          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {proposal.versions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setRoundId(v.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border transition-colors ${
                    round?.id === v.id ? "border-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {roundLabel(v.number)}
                  {v.id === proposal.currentVersionId && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="The client sees this round" />
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => newRoundMutation.mutate()}
                disabled={newRoundMutation.isPending}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {newRoundMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                New round
              </button>
            </div>

            {round && (
              <ProposalRound
                key={round.id}
                proposalId={proposal.id}
                version={round}
                isCurrent={round.id === proposal.currentVersionId}
                hasShownRound={proposal.currentVersionId !== null}
                comments={proposal.comments.filter((c) => c.versionId === round.id).length}
                onSaved={(saved) => {
                  const versions = proposal.versions.map((v) => (v.id === saved.id ? saved : v));
                  // The first round with slides becomes the client's round on the server too
                  const currentVersionId =
                    proposal.currentVersionId ?? (saved.slides.length > 0 ? saved.id : null);
                  cache({ ...proposal, versions, currentVersionId });
                }}
                onShow={() => showRoundMutation.mutate(round.id)}
                showing={showRoundMutation.isPending}
                onDelete={() => {
                  if (confirm(`Delete ${roundLabel(round.number)} with its slides and comments?`)) {
                    deleteRoundMutation.mutate(round.id);
                  }
                }}
                deleteError={deleteRoundMutation.error?.message}
                onReopened={refresh}
              />
            )}
          </div>

          {/* Details and link */}
          <div className="space-y-6">
            <ProposalSharePanel
              proposal={proposal}
              onUpdated={(saved) => cache({ ...proposal, ...saved })}
            />

            <div className="space-y-5 p-6 border border-border">
              <h2 className="font-semibold">Details</h2>
              <div>
                <label className={labelClass}>Client</label>
                <input
                  value={formData.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Title</label>
                <input
                  value={formData.title ?? ""}
                  onChange={(e) => update("title", e.target.value || null)}
                  placeholder={formData.clientName.toUpperCase()}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => changeLanguage(e.target.value as DetailsInput["language"])}
                    className={inputClass}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => update("status", e.target.value as DetailsInput["status"])}
                    className={inputClass}
                  >
                    {PROPOSAL_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Welcome text</label>
                <textarea
                  value={formData.intro ?? ""}
                  onChange={(e) => update("intro", e.target.value)}
                  rows={5}
                  className={inputClass}
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showPastRounds}
                  onChange={(e) => update("showPastRounds", e.target.checked)}
                  className="w-4 h-4 mt-0.5"
                />
                <span>
                  <span className="font-medium">Client can see earlier rounds</span>
                  <span className="block text-xs text-muted-foreground">
                    Read-only, with the comments made on them. Off: the client only sees the current round.
                  </span>
                </span>
              </label>
              <div>
                <label className={labelClass}>Internal notes</label>
                <textarea
                  value={formData.internalNotes ?? ""}
                  onChange={(e) => update("internalNotes", e.target.value)}
                  rows={3}
                  placeholder="Only you see this"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
