"use client";

/* eslint-disable @next/next/no-img-element -- slide thumbnails from the Blob store */
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileUp,
  Loader2,
  PenLine,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import type { ProposalSlide, ProposalVersion } from "@/db/schema";
import { PROPOSAL_UPLOAD_ACCEPT, roundLabel } from "@/lib/proposals";
import { filesToSlides, type SlideProgress } from "@/lib/slide-files";

type RoundInput = { note: string; slides: ProposalSlide[] };

async function saveRound({
  proposalId,
  versionId,
  data,
}: {
  proposalId: number;
  versionId: number;
  data: Partial<RoundInput> | { reopen: true };
}): Promise<ProposalVersion> {
  const res = await fetch(`/api/proposals/${proposalId}/versions/${versionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save round");
  return res.json();
}

const toInput = (v: ProposalVersion): RoundInput => ({ note: v.note ?? "", slides: v.slides });

export function ProposalRound({
  proposalId,
  version,
  isCurrent,
  hasShownRound,
  comments,
  onSaved,
  onShow,
  showing,
  onDelete,
  deleteError,
  onReopened,
}: {
  proposalId: number;
  version: ProposalVersion;
  isCurrent: boolean;
  hasShownRound: boolean;
  comments: number;
  onSaved: (version: ProposalVersion) => void;
  onShow: () => void;
  showing: boolean;
  onDelete: () => void;
  deleteError?: string;
  onReopened: () => void;
}) {
  const [data, setData] = useState<RoundInput>(() => toInput(version));
  const [progress, setProgress] = useState<SlideProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastSaved = useRef(JSON.stringify(toInput(version)));
  const hasChanges = JSON.stringify(data) !== lastSaved.current;

  const mutation = useMutation({
    mutationFn: saveRound,
    onSuccess: (saved, { data: sent }) => {
      lastSaved.current = JSON.stringify({ ...JSON.parse(lastSaved.current), ...sent });
      onSaved(saved);
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => saveRound({ proposalId, versionId: version.id, data: { reopen: true } }),
    onSuccess: (saved) => {
      onSaved(saved);
      onReopened();
    },
  });

  // Saves one request at a time, so removed images are never deleted out of order
  useEffect(() => {
    if (!hasChanges || mutation.isPending) return;
    const timeout = setTimeout(() => {
      const saved = JSON.parse(lastSaved.current) as RoundInput;
      const changed: Partial<RoundInput> = {};
      if (data.note !== saved.note) changed.note = data.note;
      if (JSON.stringify(data.slides) !== JSON.stringify(saved.slides)) changed.slides = data.slides;
      mutation.mutate({ proposalId, versionId: version.id, data: changed });
    }, 800);
    return () => clearTimeout(timeout);
  }, [data, hasChanges, mutation, proposalId, version.id]);

  useEffect(() => {
    if (!hasChanges && !progress) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges, progress]);

  const setSlides = (update: (slides: ProposalSlide[]) => ProposalSlide[]) =>
    setData((prev) => ({ ...prev, slides: update(prev.slides) }));

  const addFiles = async (files: File[]) => {
    if (!files.length || progress) return;
    setUploadError(null);
    try {
      await filesToSlides(
        files,
        (slide) => setSlides((slides) => [...slides, slide]),
        setProgress
      );
    } catch (error) {
      setUploadError((error as Error).message || "Upload failed");
    } finally {
      setProgress(null);
    }
  };

  const move = (index: number, direction: -1 | 1) =>
    setSlides((slides) => {
      const next = [...slides];
      const target = index + direction;
      if (target < 0 || target >= next.length) return slides;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const locked = !!version.decision;

  return (
    <div className="space-y-4 p-6 border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{roundLabel(version.number)}</h2>
          <p className="text-sm text-muted-foreground">
            {data.slides.length} {data.slides.length === 1 ? "slide" : "slides"} · {comments}{" "}
            {comments === 1 ? "comment" : "comments"}
            {mutation.isPending && " · saving…"}
            {mutation.isError && <span className="text-destructive"> · couldn&apos;t save</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCurrent ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-green-500/10 text-green-500">
              <Eye className="h-3.5 w-3.5" />
              {hasShownRound ? "Client sees this round" : "Shown once it has slides"}
            </span>
          ) : (
            <button
              type="button"
              onClick={onShow}
              disabled={showing || data.slides.length === 0 || hasChanges}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
              title={data.slides.length === 0 ? "Add slides first" : "The client link switches to this round"}
            >
              {showing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Show this round to the client
            </button>
          )}
          {!isCurrent && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 text-muted-foreground hover:text-destructive"
              title="Delete round"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

      {version.decision && (
        <div
          className={`flex flex-wrap items-start justify-between gap-3 p-3 text-sm ${
            version.decision === "approved" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-400"
          }`}
        >
          <div className="flex items-start gap-2">
            {version.decision === "approved" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5" />
            ) : (
              <PenLine className="h-4 w-4 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                {version.decision === "approved" ? "Approved" : "Changes requested"} by {version.decidedBy}
                {version.decidedAt && ` · ${new Date(version.decidedAt).toLocaleDateString("es-CO")}`}
              </p>
              {version.decisionNote && <p className="mt-1 whitespace-pre-line opacity-90">{version.decisionNote}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => reopenMutation.mutate()}
            disabled={reopenMutation.isPending}
            className="inline-flex items-center gap-1.5 text-xs underline hover:no-underline"
            title="Clears the decision so the client can comment and decide again"
          >
            <RotateCcw className="h-3 w-3" />
            Reopen round
          </button>
        </div>
      )}

      {version.number > 1 && (
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">What changed (shown to the client)</label>
          <textarea
            value={data.note}
            onChange={(e) => setData((prev) => ({ ...prev, note: e.target.value }))}
            rows={2}
            placeholder="Adjusted the logo weight, new color palette…"
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
      )}

      {/* Upload */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles([...e.dataTransfer.files]);
        }}
        onClick={() => !progress && fileInput.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-8 border border-dashed text-center cursor-pointer transition-colors ${
          dragging ? "border-foreground bg-muted/50" : "border-border hover:border-foreground/40"
        }`}
      >
        {progress ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm">
              {progress.pages > 1
                ? `Rendering page ${progress.page} of ${progress.pages}`
                : `Uploading ${progress.file}`}
            </p>
            <p className="text-xs text-muted-foreground">{progress.file}</p>
          </>
        ) : (
          <>
            <FileUp className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm">
              Drop a <strong>PDF</strong> or <strong>PNG/JPG/WebP</strong> images, or click to choose
            </p>
            <p className="text-xs text-muted-foreground">
              Each PDF page becomes a slide, rendered sharp for retina. Slides are added at the end.
              {locked && " This round was already decided; new slides are visible to the client."}
            </p>
          </>
        )}
        <input
          ref={fileInput}
          type="file"
          accept={PROPOSAL_UPLOAD_ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            addFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </div>
      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

      {/* Slides */}
      {data.slides.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">
          {data.slides.map((slide, i) => (
            <div key={slide.id} className="group space-y-2">
              <div className="relative bg-muted/30 border border-border" style={{ aspectRatio: `${slide.width} / ${slide.height}` }}>
                <img src={slide.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[10px] tabular-nums">
                  {i + 1}
                </span>
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton title="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton title="Move right" disabled={i === data.slides.length - 1} onClick={() => move(i, 1)}>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    title="Remove slide"
                    onClick={() => {
                      if (confirm("Remove this slide? Its comments stay in the database but won't show.")) {
                        setSlides((slides) => slides.filter((s) => s.id !== slide.id));
                      }
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </div>
              <input
                value={slide.title}
                onChange={(e) =>
                  setSlides((slides) => slides.map((s) => (s.id === slide.id ? { ...s, title: e.target.value } : s)))
                }
                placeholder={`Slide ${i + 1}`}
                className="w-full px-2 py-1 text-xs bg-transparent border border-transparent hover:border-border focus:border-border focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconButton({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="p-1 bg-black/70 text-white hover:bg-black disabled:opacity-30"
    >
      {children}
    </button>
  );
}
