"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, FileDown, FileText, RefreshCw } from "lucide-react";
import {
  proposalFileName,
  proposalHeading,
  roundLabel,
  toViewerComment,
  toViewerRound,
  type ProposalWithRounds,
} from "@/lib/proposals";
import { feedbackToMarkdown, type FeedbackExportData } from "@/lib/proposal-export";
import { printBudgetDocument } from "@/components/budget-viewer";
import { ProposalViewer, type ViewerActions } from "@/components/proposal-viewer";
import { ProposalFeedbackDocument } from "./proposal-feedback-document";
import { fetchProposal } from "./proposal-editor";

function downloadText(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Request failed");
  return res.json();
}

/** Admin calls for the viewer: you comment as the studio, reply, resolve and delete. */
function adminActions(proposalId: number, onFresh: (fresh: ProposalWithRounds) => void): ViewerActions {
  const base = `/api/proposals/${proposalId}`;
  const safe = async <T,>(run: () => Promise<T>) => {
    try {
      return { ok: true as const, ...(await run()) };
    } catch (error) {
      return { ok: false as const, error: (error as Error).message };
    }
  };
  // After a change, reload in the background so the export matches what you see
  const reload = <T,>(result: T) => {
    fetchProposal(proposalId).then(onFresh, () => {});
    return result;
  };
  return {
    list: (versionId) =>
      safe(async () => {
        const fresh = await fetchProposal(proposalId);
        onFresh(fresh);
        const version = fresh.versions.find((v) => v.id === versionId);
        if (!version) throw new Error("Round not found");
        return {
          comments: fresh.comments.filter((c) => c.versionId === versionId).map((c) => toViewerComment(c)),
          round: toViewerRound(version),
        };
      }),
    add: ({ authorKey: _key, authorName: _name, ...input }) =>
      safe(async () =>
        reload({
          comment: await json(
            await fetch(`${base}/comments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            })
          ),
        })
      ),
    remove: (commentId) =>
      safe(async () => {
        await json(await fetch(`${base}/comments/${commentId}`, { method: "DELETE" }));
        return reload({});
      }),
    resolve: (commentId, resolved) =>
      safe(async () =>
        reload({
          comment: await json(
            await fetch(`${base}/comments/${commentId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resolved }),
            })
          ),
        })
      ),
  } as ViewerActions;
}

export function ProposalFeedback({
  proposal,
  onRefresh,
  onFresh,
  refreshing,
}: {
  proposal: ProposalWithRounds;
  onRefresh: () => void;
  onFresh: (fresh: ProposalWithRounds) => void;
  refreshing: boolean;
}) {
  const onFreshRef = useRef(onFresh);
  useEffect(() => {
    onFreshRef.current = onFresh;
  });
  const rounds = useMemo(() => proposal.versions.filter((v) => v.slides.length > 0).map(toViewerRound), [proposal.versions]);
  const comments = useMemo(() => proposal.comments.map((c) => toViewerComment(c)), [proposal.comments]);
  const actions = useMemo(() => adminActions(proposal.id, (fresh) => onFreshRef.current(fresh)), [proposal.id]);
  const [exportRoundId, setExportRoundId] = useState(proposal.currentVersionId ?? rounds.at(-1)?.id ?? null);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  if (!rounds.length) {
    return <p className="py-12 text-center text-muted-foreground">Upload slides first; the client&apos;s comments show up here.</p>;
  }

  const exportRound = rounds.find((r) => r.id === exportRoundId) ?? rounds.at(-1)!;
  const data: FeedbackExportData = {
    code: proposal.code,
    clientName: proposal.clientName,
    title: proposal.title,
    language: proposal.language,
    round: exportRound,
    comments: comments.filter((c) => c.versionId === exportRound.id),
  };
  const fileName = `${proposalFileName(proposal, exportRound.number)}_feedback`;
  const markdown = () => feedbackToMarkdown(data, { onlyOpen });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 p-4 border border-border">
        <span className="font-semibold mr-2">Export</span>
        <select
          value={exportRound.id}
          onChange={(e) => setExportRoundId(Number(e.target.value))}
          className="px-2 py-1.5 text-sm bg-background border border-border"
          aria-label="Round to export"
        >
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {roundLabel(r.number)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="w-4 h-4" />
          Only unresolved
        </label>
        <div className="flex flex-wrap gap-2 ml-auto">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(markdown());
              setCopied(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy Markdown"}
          </button>
          <button
            type="button"
            onClick={() => downloadText(markdown(), `${fileName}.md`)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
          >
            <FileText className="h-4 w-4" />
            .md
          </button>
          <button
            type="button"
            onClick={() => printBudgetDocument(printRef.current, fileName)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Load the latest comments"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Same viewer the client uses, with resolve and delete; comments you add are signed as the studio */}
      <div className="border border-border">
        <ProposalViewer
          key={rounds.map((r) => r.id).join()}
          mode="admin"
          heading={proposalHeading(proposal)}
          clientName={proposal.clientName}
          intro=""
          language={proposal.language}
          rounds={rounds}
          currentRoundId={proposal.currentVersionId}
          initialRoundId={exportRound.id}
          initialComments={comments}
          actions={actions}
          className="h-[calc(100dvh-260px)] min-h-[560px]"
        />
      </div>

      {/* Only for printing */}
      <div ref={printRef} className="hidden">
        <ProposalFeedbackDocument data={data} onlyOpen={onlyOpen} />
      </div>
    </div>
  );
}
