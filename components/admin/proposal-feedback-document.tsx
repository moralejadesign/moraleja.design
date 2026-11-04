/* eslint-disable @next/next/no-img-element -- slide images and brand SVGs, printed as-is */
import { BUDGET_CONTACT } from "@/lib/budgets";
import { proposalHeading, roundLabel } from "@/lib/proposals";
import { FEEDBACK_LABELS, decisionText, feedbackBySlide, type FeedbackExportData } from "@/lib/proposal-export";
import { DocumentFooter } from "./budget-document";

const SLIDE_WIDTH = 656; // the document's 800px minus its side margins

/** The round's feedback as a Moraleja document: each slide with its numbered pins and comments. */
export function ProposalFeedbackDocument({ data, onlyOpen }: { data: FeedbackExportData; onlyOpen: boolean }) {
  const t = FEEDBACK_LABELS[data.language];
  const slides = feedbackBySlide(data, { onlyOpen });

  return (
    <article
      className="budget-document relative w-[800px] overflow-hidden bg-[#0a0a0a] font-sans text-white"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      <img
        src="/budgets/wave-header.svg"
        alt=""
        className="pointer-events-none absolute -left-[40px] -top-[60px] w-[900px] max-w-none"
      />
      <div className="relative flex items-start justify-between px-[72px] pt-[44px]">
        <span className="relative -ml-2 mt-1 bg-[#0a0a0a] px-2 py-1 text-[10px] font-bold tracking-[0.35em]">
          {BUDGET_CONTACT.site}
        </span>
        <img src="/budgets/studio-logo.svg" alt="Moraleja Studio" className="relative w-[96px]" />
      </div>

      <header className="relative mt-[56px] px-[72px] text-center">
        <h1 className="text-[22px] font-bold uppercase tracking-[0.5em]">{proposalHeading(data)}</h1>
        <p className="mt-3 text-[10px] uppercase tracking-[0.5em] text-white/40">
          {t.feedback} {roundLabel(data.round.number)}
          {"  ·  "}
          {data.code}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/60">{decisionText(data.round, data.language)}</p>
        {data.round.decisionNote && (
          <p className="mx-auto mt-4 max-w-[480px] whitespace-pre-line text-[10.5px] leading-[1.65] text-white/70">
            {data.round.decisionNote}
          </p>
        )}
      </header>

      <div className="relative mt-[48px] space-y-[44px] px-[72px]">
        {slides.map(({ index, slide, threads, reactions }) => (
          <section key={slide.id} className="break-inside-avoid">
            <h2 className="flex items-baseline gap-3 border-b border-white/20 pb-3 text-[13px] font-medium uppercase tracking-[0.3em]">
              <span className="text-[11px] text-white/40">{String(index + 1).padStart(2, "0")}</span>
              <span>{slide.title || `${t.slide} ${index + 1}`}</span>
            </h2>

            <div className="relative mt-5" style={{ width: SLIDE_WIDTH, height: (SLIDE_WIDTH * slide.height) / slide.width }}>
              <img src={slide.url} alt="" className="absolute inset-0 h-full w-full" />
              {threads
                .filter((th) => th.number !== null)
                .map(({ comment, number }) => (
                  <span
                    key={comment.id}
                    style={{ left: `${comment.x! * 100}%`, top: `${comment.y! * 100}%` }}
                    className="absolute flex h-[20px] min-w-[20px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black bg-white px-1 text-[9px] font-bold text-black"
                  >
                    {number}
                  </span>
                ))}
            </div>

            {(reactions.like.length > 0 || reactions.changes.length > 0) && (
              <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-white/50">
                {reactions.like.length > 0 && `${t.reactions.like}: ${reactions.like.join(", ")}`}
                {reactions.like.length > 0 && reactions.changes.length > 0 && "   ·   "}
                {reactions.changes.length > 0 && `${t.reactions.changes}: ${reactions.changes.join(", ")}`}
              </p>
            )}

            <div className="mt-4 space-y-[14px]">
              {threads.length === 0 && (
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/25">{t.noComments}</p>
              )}
              {threads.map(({ comment, number, replies }) => (
                <div key={comment.id} className={`flex gap-4 ${comment.resolved ? "opacity-50" : ""}`}>
                  <span className="w-5 shrink-0 pt-[1px] text-[10px] tabular-nums text-white/50">
                    {number ? `#${number}` : "—"}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-[10.5px] leading-[1.65] text-white/80">
                      <span className="font-semibold uppercase tracking-[0.08em] text-white">{comment.authorName}</span>
                      {comment.resolved && <span className="text-white/40"> ({t.resolved})</span>}
                      <span className="block whitespace-pre-line">{comment.body}</span>
                    </p>
                    {replies.map((reply) => (
                      <p key={reply.id} className="border-l border-white/30 pl-3 text-[9.5px] leading-[1.6] text-white/60">
                        <span className="font-bold uppercase tracking-[0.2em] text-white/80">{reply.authorName}: </span>
                        <span className="whitespace-pre-line">{reply.body}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <DocumentFooter />
    </article>
  );
}
