"use client";

/* eslint-disable @next/next/no-img-element -- slide images are shown at their exact size, pins sit on top */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  RotateCcw,
  ThumbsUp,
  Trash2,
  X,
  PenLine,
} from "lucide-react";
import type { BudgetLanguage, ProposalDecision, ProposalReaction, ProposalSlide } from "@/db/schema";
import {
  AUTHOR_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
  VIEWER_COPY,
  pinNumbers,
  roundLabel,
  type ViewerComment,
  type ViewerCopy,
  type ViewerRound,
} from "@/lib/proposals";

type Fail = { ok: false; error: string };

export type CommentInput = {
  versionId: number;
  slideId: string;
  parentId?: number | null;
  body: string;
  x?: number | null;
  y?: number | null;
  authorName: string;
  authorKey: string;
};

/** What the viewer can do; the client link passes server actions, the admin passes API calls. */
export type ViewerActions = {
  list: (versionId: number, authorKey: string) => Promise<{ ok: true; comments: ViewerComment[]; round: ViewerRound } | Fail>;
  add: (input: CommentInput) => Promise<{ ok: true; comment: ViewerComment } | Fail>;
  remove: (commentId: number, authorKey: string) => Promise<{ ok: true } | Fail>;
  react?: (input: {
    versionId: number;
    slideId: string;
    reaction: ProposalReaction | null;
    authorName: string;
  }) => Promise<{ ok: true; reactions: ViewerRound["reactions"] } | Fail>;
  decide?: (input: {
    versionId: number;
    decision: ProposalDecision;
    note: string;
    authorName: string;
  }) => Promise<{ ok: true; round: ViewerRound } | Fail>;
  resolve?: (commentId: number, resolved: boolean) => Promise<{ ok: true; comment: ViewerComment } | Fail>;
};

type Reviewer = { name: string; key: string };
const REVIEWER_STORAGE = "moraleja-proposal-reviewer";
const POLL_MS = 30_000;

function loadReviewer(): Reviewer | null {
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEWER_STORAGE) ?? "null");
    return saved?.name && saved?.key ? saved : null;
  } catch {
    return null;
  }
}

/** The random key identifies this browser's comments; it exists before a name is given. */
function reviewerKey() {
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEWER_STORAGE) ?? "null");
    if (saved?.key) return saved.key as string;
  } catch {}
  const key = crypto.randomUUID();
  localStorage.setItem(REVIEWER_STORAGE, JSON.stringify({ name: "", key }));
  return key;
}

/** Largest size of a slide that fits the box, keeping its proportions. */
function fitSize(slide: ProposalSlide, box: { width: number; height: number }) {
  if (!box.width || !box.height) return { width: 0, height: 0 };
  const scale = Math.min(box.width / slide.width, box.height / slide.height);
  return { width: Math.floor(slide.width * scale), height: Math.floor(slide.height * scale) };
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable);

export function ProposalViewer({
  mode,
  heading,
  clientName,
  intro,
  language,
  rounds: initialRounds,
  currentRoundId,
  initialComments,
  actions,
  className = "h-dvh",
  initialRoundId,
}: {
  mode: "client" | "admin";
  heading: string;
  clientName: string;
  intro: string;
  language: BudgetLanguage;
  rounds: ViewerRound[];
  currentRoundId: number | null;
  initialComments: ViewerComment[];
  actions: ViewerActions;
  className?: string;
  initialRoundId?: number;
}) {
  const isAdmin = mode === "admin";
  // The admin works in English; the client sees the proposal's language
  const t: ViewerCopy = VIEWER_COPY[isAdmin ? "en" : language];
  const locale = (isAdmin ? "en" : language) === "es" ? "es-CO" : "en-US";

  const [rounds, setRounds] = useState(initialRounds);
  const [comments, setComments] = useState(initialComments);
  const [roundId, setRoundId] = useState<number | null>(
    initialRoundId ?? currentRoundId ?? initialRounds.at(-1)?.id ?? null
  );
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(isAdmin);
  const [pinMode, setPinMode] = useState(false);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [authorKey, setAuthorKey] = useState("");
  const [askName, setAskName] = useState<((name: string | null) => void) | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const round = rounds.find((r) => r.id === roundId) ?? rounds.at(-1) ?? null;
  const slides = round?.slides ?? [];
  const slide = slides[Math.min(index, slides.length - 1)] ?? null;
  const isCurrent = round?.id === currentRoundId;
  // The admin can always comment; the client only on the current round until it is decided
  const writable = isAdmin || (isCurrent && !round?.decision);

  // Who is commenting, from this browser; the admin always signs as the studio
  useEffect(() => {
    setMounted(true);
    if (isAdmin) return;
    setAuthorKey(reviewerKey());
    setReviewer(loadReviewer());
  }, [isAdmin]);

  const roundComments = useMemo(() => comments.filter((c) => c.versionId === round?.id), [comments, round?.id]);

  const refresh = useCallback(async () => {
    if (!round) return;
    const result = await actions.list(round.id, isAdmin ? "" : authorKey);
    if (!result.ok) return;
    setComments((prev) => [...prev.filter((c) => c.versionId !== round.id), ...result.comments]);
    setRounds((prev) => prev.map((r) => (r.id === result.round.id ? result.round : r)));
  }, [actions, round, authorKey, isAdmin]);

  // Marks which comments are this reviewer's, then keeps replies coming in
  useEffect(() => {
    if (!isAdmin && !authorKey) return;
    refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh, isAdmin, authorKey]);

  const goTo = useCallback(
    (next: number) => {
      if (!slides.length) return;
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
      setDraft(null);
      setActiveThread(null);
    },
    [slides.length]
  );

  // Arrow keys move between slides, C toggles pin mode, Esc cancels
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "Escape") {
        setDraft(null);
        setPinMode(false);
      } else if ((e.key === "c" || e.key === "C") && writable) setPinMode((on) => !on);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, index, goTo, writable]);

  // Preload the neighbours so moving between slides feels instant
  useEffect(() => {
    [slides[index + 1], slides[index - 1]].forEach((s) => {
      if (s) new Image().src = s.url;
    });
  }, [index, slides]);

  /** The reviewer's name, asking for it the first time; null if they cancel. */
  const getName = (): Promise<string | null> => {
    if (isAdmin) return Promise.resolve(t.studio);
    if (reviewer?.name) return Promise.resolve(reviewer.name);
    return new Promise((resolve) => setAskName(() => resolve));
  };

  const saveName = (name: string) => {
    const next = { name: name.trim().slice(0, AUTHOR_MAX_LENGTH), key: authorKey || reviewerKey() };
    localStorage.setItem(REVIEWER_STORAGE, JSON.stringify(next));
    setReviewer(next);
    setAuthorKey(next.key);
    const pending = askName;
    setAskName(null);
    pending?.(next.name);
  };

  const cancelName = () => {
    askName?.(null);
    setAskName(null);
  };

  const fail = (result: Fail) => {
    setError(result.error === "locked" ? t.locked : t.failed);
    if (result.error === "locked") refresh();
  };

  const postComment = async (input: Omit<CommentInput, "versionId" | "slideId" | "authorName" | "authorKey">) => {
    if (!round || !slide) return false;
    const name = await getName();
    if (!name) return false;
    const result = await actions.add({
      ...input,
      versionId: round.id,
      slideId: slide.id,
      authorName: name,
      authorKey: isAdmin ? "" : authorKey,
    });
    if (!result.ok) {
      fail(result);
      return false;
    }
    setError(null);
    setComments((prev) => [...prev, result.comment]);
    if (input.x != null && !input.parentId) setActiveThread(result.comment.id);
    return true;
  };

  const removeComment = async (comment: ViewerComment) => {
    const result = await actions.remove(comment.id, authorKey);
    if (!result.ok) return fail(result);
    setComments((prev) => prev.filter((c) => c.id !== comment.id && c.parentId !== comment.id));
  };

  const toggleResolved = async (comment: ViewerComment) => {
    if (!actions.resolve) return;
    const result = await actions.resolve(comment.id, !comment.resolved);
    if (!result.ok) return fail(result);
    setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, resolved: result.comment.resolved } : c)));
  };

  const react = async (reaction: ProposalReaction) => {
    if (!round || !slide || !actions.react) return;
    const name = await getName();
    if (!name) return;
    const mine = round.reactions[slide.id]?.[name];
    const result = await actions.react({
      versionId: round.id,
      slideId: slide.id,
      reaction: mine === reaction ? null : reaction,
      authorName: name,
    });
    if (!result.ok) return fail(result);
    setRounds((prev) => prev.map((r) => (r.id === round.id ? { ...r, reactions: result.reactions } : r)));
  };

  const pins = slide ? pinNumbers(roundComments, slide.id) : new Map<number, number>();
  const slideThreads = slide
    ? roundComments
        .filter((c) => c.slideId === slide.id && c.parentId === null)
        .filter((c) => !onlyOpen || !c.resolved)
        .sort((a, b) => (pins.get(a.id) ?? Infinity) - (pins.get(b.id) ?? Infinity) || a.id - b.id)
    : [];
  const threadCount = (slideId: string) =>
    roundComments.filter((c) => c.slideId === slideId && c.parentId === null && (!isAdmin || !c.resolved)).length;

  if (!round || !slide) {
    return (
      <div className={`${className} flex items-center justify-center bg-[#0a0a0a] text-white/50 text-sm`}>
        {isAdmin ? "This round has no slides yet." : "—"}
      </div>
    );
  }

  if (!started) {
    return (
      <IntroScreen
        heading={heading}
        clientName={clientName}
        intro={intro}
        round={round}
        showRound={rounds.length > 1 || round.number > 1}
        t={t}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className={`${className} relative flex flex-col bg-[#0a0a0a] text-white overflow-hidden`}>
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-white/10 shrink-0">
        {!isAdmin && (
          <button
            type="button"
            onClick={() => setStarted(false)}
            className="text-[11px] uppercase tracking-[0.3em] truncate hover:text-white/70"
          >
            {heading}
          </button>
        )}
        {rounds.length > 1 ? (
          <select
            value={round.id}
            onChange={(e) => {
              setRoundId(Number(e.target.value));
              setIndex(0);
              setDraft(null);
              setActiveThread(null);
            }}
            className="bg-transparent border border-white/20 px-2 py-1 text-xs focus:outline-none"
            aria-label={t.round}
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id} className="bg-[#0a0a0a]">
                {roundLabel(r.number)}
                {r.id === currentRoundId && rounds.length > 1 ? " ·" : ""}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-white/50">{roundLabel(round.number)}</span>
        )}
        <span className="text-xs text-white/50 tabular-nums">
          {index + 1} / {slides.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {round.decision && <DecisionBadge round={round} t={t} locale={locale} mounted={mounted} />}
          {writable && (
            <button
              type="button"
              onClick={() => {
                setPinMode((on) => !on);
                setDraft(null);
              }}
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs border transition-colors ${
                pinMode ? "bg-white text-black border-white" : "border-white/25 hover:border-white"
              }`}
              title={`${t.commentMode} (C)`}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              {t.commentMode}
            </button>
          )}
          {!isAdmin && writable && actions.decide && (
            <button
              type="button"
              onClick={async () => {
                if (await getName()) setDeciding(true);
              }}
              className="px-3 py-1.5 text-xs bg-white text-black hover:bg-white/90 transition-colors"
            >
              {t.finish}
            </button>
          )}
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/25"
            aria-label={t.comments}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {threadCount(slide.id) || ""}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Slide */}
        <div className="relative flex-1 min-w-0 flex flex-col">
          <SlideStage
            slide={slide}
            comments={roundComments.filter((c) => c.slideId === slide.id && c.parentId === null)}
            pins={pins}
            draft={draft}
            activeThread={activeThread}
            pinMode={pinMode && writable}
            showResolved={!onlyOpen}
            onPlace={(point) => {
              setDraft(point);
              setActiveThread(null);
              setPanelOpen(true);
            }}
            onSelect={(id) => {
              setActiveThread(id);
              setPanelOpen(true);
            }}
            onSwipe={(dir) => goTo(index + dir)}
          />
          {writable && (
            <p className="sm:hidden px-4 pb-2 text-center text-[11px] text-white/40">
              <button type="button" onClick={() => setPinMode((on) => !on)} className="underline">
                {pinMode ? t.cancel : t.commentMode}
              </button>
            </p>
          )}
          <Filmstrip
            slides={slides}
            index={index}
            count={threadCount}
            onSelect={goTo}
            onPrev={() => goTo(index - 1)}
            onNext={() => goTo(index + 1)}
          />
        </div>

        {/* Comments */}
        <aside
          className={`${
            panelOpen ? "flex" : "hidden"
          } lg:flex absolute inset-x-0 bottom-0 top-14 z-20 lg:static lg:z-auto w-full lg:w-[360px] shrink-0 flex-col border-l border-white/10 bg-[#0a0a0a]`}
        >
          <div className="flex items-center justify-between gap-3 px-5 h-12 border-b border-white/10 shrink-0">
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/60">
              {slide.title || `${t.slide} ${index + 1}`}
            </span>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <label className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
                  <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
                  Unresolved
                </label>
              )}
              <button type="button" onClick={() => setPanelOpen(false)} className="lg:hidden" aria-label={t.cancel}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {!isCurrent && !isAdmin && <Notice>{t.pastRound}</Notice>}
            {isCurrent && round.decision && !isAdmin && <Notice>{t.locked}</Notice>}
            {round.note && index === 0 && (
              <div className="text-sm text-white/70">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">{t.whatChanged}</p>
                <p className="whitespace-pre-line">{round.note}</p>
              </div>
            )}

            <Reactions
              reactions={round.reactions[slide.id] ?? {}}
              mine={reviewer?.name}
              canReact={!isAdmin && writable && !!actions.react}
              onReact={react}
              t={t}
            />

            {draft && writable && (
              <Composer
                key={`${draft.x}-${draft.y}`}
                label={`#${pins.size + 1}`}
                placeholder={t.pinPlaceholder}
                t={t}
                autoFocus
                onCancel={() => setDraft(null)}
                onSend={async (body) => {
                  const ok = await postComment({ body, x: draft.x, y: draft.y });
                  if (ok) {
                    setDraft(null);
                    setPinMode(false);
                  }
                  return ok;
                }}
              />
            )}

            {slideThreads.length === 0 && !draft && (
              <p className="text-sm text-white/40">
                {t.noComments} {writable && <span className="hidden sm:inline">{t.pinHint}</span>}
              </p>
            )}

            {slideThreads.map((thread) => (
              <Thread
                key={thread.id}
                thread={thread}
                replies={roundComments.filter((c) => c.parentId === thread.id)}
                number={pins.get(thread.id)}
                active={activeThread === thread.id}
                writable={writable}
                isAdmin={isAdmin}
                t={t}
                locale={locale}
                mounted={mounted}
                onSelect={() => setActiveThread(thread.id)}
                onReply={(body) => postComment({ body, parentId: thread.id })}
                onDelete={removeComment}
                onResolve={actions.resolve ? () => toggleResolved(thread) : undefined}
              />
            ))}
          </div>

          {writable && (
            <div className="border-t border-white/10 p-4 shrink-0">
              <Composer
                key={slide.id}
                placeholder={t.general}
                t={t}
                compact
                onSend={(body) => postComment({ body })}
              />
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>
          )}
        </aside>
      </div>

      {askName && <NameDialog t={t} onSave={saveName} onCancel={cancelName} />}
      {deciding && actions.decide && (
        <DecisionDialog
          t={t}
          onCancel={() => setDeciding(false)}
          onSend={async (decision, note) => {
            const result = await actions.decide!({
              versionId: round.id,
              decision,
              note,
              authorName: reviewer?.name ?? "",
            });
            if (!result.ok) {
              fail(result);
              setDeciding(false);
              return;
            }
            setRounds((prev) => prev.map((r) => (r.id === result.round.id ? result.round : r)));
            setDeciding(false);
            setThanks(true);
          }}
        />
      )}
      {thanks && (
        <Overlay>
          <CheckCircle2 className="h-10 w-10 mx-auto text-white" />
          <p className="mt-5 text-lg">{t.thanks}</p>
          <button
            type="button"
            onClick={() => setThanks(false)}
            className="mt-8 px-5 py-2.5 border border-white/30 text-[11px] uppercase tracking-[0.3em] hover:border-white"
          >
            {t.continue}
          </button>
        </Overlay>
      )}
    </div>
  );
}

function IntroScreen({
  heading,
  clientName,
  intro,
  round,
  showRound,
  t,
  onStart,
}: {
  heading: string;
  clientName: string;
  intro: string;
  round: ViewerRound;
  showRound: boolean;
  t: ViewerCopy;
  onStart: () => void;
}) {
  const cover = round.slides[0];
  return (
    <div className="relative min-h-dvh flex items-center justify-center px-6 py-16 overflow-hidden">
      {cover && (
        <img src={cover.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15 blur-2xl scale-110" />
      )}
      <div className="relative max-w-xl text-center">
        <img src="/budgets/studio-logo.svg" alt="Moraleja Studio" className="w-[72px] mx-auto" />
        <h1 className="mt-12 text-3xl md:text-5xl font-semibold tracking-[0.12em] uppercase">{heading}</h1>
        {heading.toUpperCase() !== clientName.toUpperCase() && (
          <p className="mt-3 text-[11px] uppercase tracking-[0.4em] text-white/50">{clientName}</p>
        )}
        {showRound && (
          <p className="mt-6 text-[11px] uppercase tracking-[0.4em] text-white/60">
            {t.round} {round.number}
          </p>
        )}
        {intro && <p className="mt-8 text-sm md:text-base leading-relaxed text-white/70 whitespace-pre-line">{intro}</p>}
        {round.note && (
          <div className="mt-6 text-sm text-white/60">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">{t.whatChanged}</p>
            <p className="whitespace-pre-line">{round.note}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onStart}
          className="mt-12 inline-flex items-center gap-3 bg-white px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.3em] text-black hover:bg-white/90 transition-colors"
        >
          {t.start}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SlideStage({
  slide,
  comments,
  pins,
  draft,
  activeThread,
  pinMode,
  showResolved,
  onPlace,
  onSelect,
  onSwipe,
}: {
  slide: ProposalSlide;
  comments: ViewerComment[];
  pins: Map<number, number>;
  draft: { x: number; y: number } | null;
  activeThread: number | null;
  pinMode: boolean;
  showResolved: boolean;
  onPlace: (point: { x: number; y: number }) => void;
  onSelect: (id: number) => void;
  onSwipe: (direction: 1 | -1) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState<string | null>(null);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const size = fitSize(slide, box);

  return (
    <div
      ref={boxRef}
      className="relative flex-1 min-h-0 m-3 md:m-6 flex items-center justify-center"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null || pinMode) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) onSwipe(dx < 0 ? 1 : -1);
      }}
    >
      <div
        className={`relative ${pinMode ? "cursor-crosshair" : ""}`}
        style={{ width: size.width, height: size.height }}
        onClick={(e) => {
          if (!pinMode) return;
          const rect = e.currentTarget.getBoundingClientRect();
          onPlace({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
        }}
      >
        {loaded !== slide.url && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
        <img
          key={slide.url}
          src={slide.url}
          alt={slide.title}
          draggable={false}
          onLoad={() => setLoaded(slide.url)}
          className="absolute inset-0 h-full w-full select-none shadow-2xl shadow-black/60"
        />
        {comments
          .filter((c) => c.x !== null && c.y !== null && (showResolved || !c.resolved))
          .map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(c.id);
              }}
              style={{ left: `${c.x! * 100}%`, top: `${c.y! * 100}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 h-7 min-w-7 px-1.5 rounded-full text-[11px] font-semibold tabular-nums flex items-center justify-center border-2 transition-transform ${
                activeThread === c.id ? "scale-125 z-10" : "hover:scale-110"
              } ${
                c.resolved
                  ? "bg-black/60 border-white/40 text-white/60"
                  : c.isAdmin
                    ? "bg-black border-white text-white"
                    : "bg-white border-black text-black"
              }`}
            >
              {c.resolved ? <Check className="h-3 w-3" /> : pins.get(c.id)}
            </button>
          ))}
        {draft && (
          <span
            style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white border-2 border-black ring-4 ring-white/30 animate-pulse"
          />
        )}
      </div>
    </div>
  );
}

function Filmstrip({
  slides,
  index,
  count,
  onSelect,
  onPrev,
  onNext,
}: {
  slides: ProposalSlide[];
  index: number;
  count: (slideId: string) => number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => activeRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }), [index]);

  return (
    <div className="flex items-center gap-2 px-3 pb-3 shrink-0">
      <button
        type="button"
        onClick={onPrev}
        disabled={index === 0}
        className="p-2 text-white/60 hover:text-white disabled:opacity-20"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex-1 flex gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
        {slides.map((s, i) => {
          const n = count(s.id);
          return (
            <button
              key={s.id}
              ref={i === index ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(i)}
              className={`relative shrink-0 h-12 md:h-14 border transition-opacity ${
                i === index ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-90"
              }`}
              style={{ aspectRatio: `${s.width} / ${s.height}` }}
              title={s.title || String(i + 1)}
            >
              <img src={s.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              {n > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-white text-black text-[9px] font-semibold flex items-center justify-center">
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={index === slides.length - 1}
        className="p-2 text-white/60 hover:text-white disabled:opacity-20"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function Reactions({
  reactions,
  mine,
  canReact,
  onReact,
  t,
}: {
  reactions: Record<string, ProposalReaction>;
  mine: string | undefined;
  canReact: boolean;
  onReact: (reaction: ProposalReaction) => void;
  t: ViewerCopy;
}) {
  const names = (reaction: ProposalReaction) =>
    Object.entries(reactions)
      .filter(([, r]) => r === reaction)
      .map(([name]) => name);
  const options: { value: ProposalReaction; label: string; icon: React.ReactNode }[] = [
    { value: "like", label: t.like, icon: <ThumbsUp className="h-3.5 w-3.5" /> },
    { value: "changes", label: t.changes, icon: <PenLine className="h-3.5 w-3.5" /> },
  ];
  if (!canReact && Object.keys(reactions).length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const who = names(option.value);
        const selected = !!mine && reactions[mine] === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={!canReact}
            onClick={() => onReact(option.value)}
            title={who.join(", ")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs border transition-colors disabled:cursor-default ${
              selected ? "bg-white text-black border-white" : "border-white/20 text-white/70 enabled:hover:border-white"
            }`}
          >
            {option.icon}
            {option.label}
            {who.length > 0 && <span className="tabular-nums opacity-70">{who.length}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Thread({
  thread,
  replies,
  number,
  active,
  writable,
  isAdmin,
  t,
  locale,
  mounted,
  onSelect,
  onReply,
  onDelete,
  onResolve,
}: {
  thread: ViewerComment;
  replies: ViewerComment[];
  number: number | undefined;
  active: boolean;
  writable: boolean;
  isAdmin: boolean;
  t: ViewerCopy;
  locale: string;
  mounted: boolean;
  onSelect: () => void;
  onReply: (body: string) => Promise<boolean>;
  onDelete: (comment: ViewerComment) => void;
  onResolve?: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={`border p-3 space-y-3 transition-colors ${active ? "border-white/60" : "border-white/10"} ${
        thread.resolved ? "opacity-60" : ""
      }`}
    >
      {[thread, ...replies].map((comment, i) => (
        <div key={comment.id} className={i > 0 ? "pl-4 border-l border-white/10" : ""}>
          <div className="flex items-center gap-2 text-xs">
            {i === 0 && number !== undefined && (
              <span className="h-5 min-w-5 px-1 rounded-full bg-white text-black text-[10px] font-semibold flex items-center justify-center">
                {number}
              </span>
            )}
            <span className={`font-medium ${comment.isAdmin ? "text-white" : "text-white/80"}`}>
              {comment.authorName}
              {comment.mine && !isAdmin && <span className="text-white/40"> ({t.you})</span>}
            </span>
            {mounted && (
              <span className="text-white/30">
                {new Date(comment.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short" })}
              </span>
            )}
            {i === 0 && thread.resolved && <span className="ml-auto text-white/50">{t.resolved}</span>}
          </div>
          <p className="mt-1 text-sm text-white/85 whitespace-pre-line break-words">{comment.body}</p>
          {(comment.mine || isAdmin) && writable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`${t.delete}?`)) onDelete(comment);
              }}
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              {t.delete}
            </button>
          )}
        </div>
      ))}

      <div className="flex items-center gap-4 text-[11px]">
        {writable && !replying && (
          <button type="button" onClick={() => setReplying(true)} className="text-white/50 hover:text-white">
            {t.reply}
          </button>
        )}
        {onResolve && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResolve();
            }}
            className="inline-flex items-center gap-1 text-white/50 hover:text-white"
          >
            {thread.resolved ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            {thread.resolved ? t.reopen : t.resolve}
          </button>
        )}
      </div>

      {replying && (
        <Composer
          placeholder={t.replyPlaceholder}
          t={t}
          compact
          autoFocus
          onCancel={() => setReplying(false)}
          onSend={async (body) => {
            const ok = await onReply(body);
            if (ok) setReplying(false);
            return ok;
          }}
        />
      )}
    </div>
  );
}

function Composer({
  label,
  placeholder,
  t,
  compact,
  autoFocus,
  onSend,
  onCancel,
}: {
  label?: string;
  placeholder: string;
  t: ViewerCopy;
  compact?: boolean;
  autoFocus?: boolean;
  onSend: (body: string) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    const ok = await onSend(body.trim());
    setSending(false);
    if (ok) setBody("");
  };

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      {label && <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">{label}</p>}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          if (e.key === "Escape") onCancel?.();
        }}
        placeholder={placeholder}
        maxLength={COMMENT_MAX_LENGTH}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        className="w-full resize-none bg-transparent border border-white/20 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/60"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-white/60 hover:text-white">
            {t.cancel}
          </button>
        )}
        <button
          type="button"
          onClick={send}
          disabled={!body.trim() || sending}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-white text-black disabled:opacity-40"
        >
          {sending && <Loader2 className="h-3 w-3 animate-spin" />}
          {t.send}
        </button>
      </div>
    </div>
  );
}

function DecisionBadge({ round, t, locale, mounted }: { round: ViewerRound; t: ViewerCopy; locale: string; mounted: boolean }) {
  const approved = round.decision === "approved";
  return (
    <span
      className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs ${
        approved ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"
      }`}
      title={round.decisionNote || undefined}
    >
      {approved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
      {approved ? t.approved : t.changesRequested}
      {mounted && round.decidedAt && (
        <span className="opacity-70">
          {t.decidedBy(round.decidedBy, new Date(round.decidedAt).toLocaleDateString(locale, { day: "numeric", month: "short" }))}
        </span>
      )}
    </span>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-2 bg-white/5 text-xs text-white/60">{children}</p>;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm text-center">{children}</div>
    </div>
  );
}

function NameDialog({ t, onSave, onCancel }: { t: ViewerCopy; onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  return (
    <Overlay>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave(name);
        }}
      >
        <p className="text-lg">{t.namePrompt}</p>
        <p className="mt-2 text-sm text-white/50">{t.nameHelp}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          maxLength={AUTHOR_MAX_LENGTH}
          autoFocus
          className="mt-6 w-full bg-transparent border border-white/25 px-4 py-3 text-center focus:outline-none focus:border-white"
        />
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 border border-white/20 text-xs uppercase tracking-[0.2em]">
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 px-4 py-3 bg-white text-black text-xs font-semibold uppercase tracking-[0.2em] disabled:opacity-40"
          >
            {t.continue}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function DecisionDialog({
  t,
  onSend,
  onCancel,
}: {
  t: ViewerCopy;
  onSend: (decision: ProposalDecision, note: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [decision, setDecision] = useState<ProposalDecision | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <Overlay>
      <p className="text-lg">{t.decisionTitle}</p>
      <p className="mt-2 text-sm text-white/50">{t.decisionHelp}</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {(
          [
            { value: "approved", label: t.approve, icon: <CheckCircle2 className="h-5 w-5" /> },
            { value: "changes_requested", label: t.requestChanges, icon: <PenLine className="h-5 w-5" /> },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDecision(option.value)}
            className={`flex flex-col items-center gap-2 px-3 py-5 border text-sm transition-colors ${
              decision === option.value ? "bg-white text-black border-white" : "border-white/20 hover:border-white/60"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.decisionNote}
        maxLength={COMMENT_MAX_LENGTH}
        rows={3}
        className="mt-4 w-full resize-none bg-transparent border border-white/20 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/60"
      />
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-white/20 text-xs uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.cancel}
        </button>
        <button
          type="button"
          disabled={!decision || sending}
          onClick={async () => {
            setSending(true);
            await onSend(decision!, note);
            setSending(false);
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black text-xs font-semibold uppercase tracking-[0.2em] disabled:opacity-40"
        >
          {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t.confirm}
        </button>
      </div>
    </Overlay>
  );
}
