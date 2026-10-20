/* eslint-disable @next/next/no-img-element -- static brand SVGs, printed as-is */
import type { BriefingAnswer, BriefingLink, BriefingQuestion } from "@/db/schema";
import { BUDGET_CONTACT } from "@/lib/budgets";
import { SLIDER_STEPS, briefingHeading, isAnswered, isImageUrl, isUploaded, topicLabel } from "@/lib/briefings";
import { EXPORT_LABELS, formatDate, groupQuestions, type BriefingExportData } from "@/lib/briefing-export";
import { DocumentFooter } from "./budget-document";

/** Letter-spaced line of characters, like the date under the budget title. */
function spaced(text: string) {
  return text.split("").join(" ");
}

function Answer({ question, answer, noAnswer }: { question: BriefingQuestion; answer: BriefingAnswer | undefined; noAnswer: string }) {
  if (!isAnswered(answer)) {
    return <p className="text-[9px] uppercase tracking-[0.3em] text-white/25">{noAnswer}</p>;
  }

  if (question.type === "slider" && typeof answer === "number") {
    return (
      <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.25em]">
        <span className={`w-[112px] shrink-0 ${answer < 3 ? "text-white" : "text-white/45"}`}>{question.minLabel}</span>
        <span className="relative flex items-center gap-[18px]">
          <span className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
          {Array.from({ length: SLIDER_STEPS }, (_, i) => (
            <span
              key={i}
              className={`relative rounded-full ${
                i + 1 === answer ? "h-[11px] w-[11px] bg-white" : "h-[7px] w-[7px] border border-white/40 bg-[#0a0a0a]"
              }`}
            />
          ))}
        </span>
        <span className={answer > 3 ? "text-white" : "text-white/45"}>{question.maxLabel}</span>
      </div>
    );
  }

  if (question.type === "files") {
    const items = answer as BriefingLink[];
    const images = items.filter((item) => isUploaded(item) && isImageUrl(item.url));
    const others = items.filter((item) => !images.includes(item));
    return (
      <div className="space-y-3">
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image) => (
              <img
                key={image.url}
                src={image.url}
                alt={image.note}
                className="aspect-square w-full border border-white/15 object-cover"
              />
            ))}
          </div>
        )}
        {others.length > 0 && (
          <ul className="space-y-1.5">
            {others.map((item, i) => (
              <li key={i} className="flex gap-2 text-[10.5px] leading-[1.5]">
                <span>+</span>
                <span className="min-w-0 break-words">
                  {isUploaded(item) ? (
                    <span className="text-white underline decoration-white/30">{item.note || item.url}</span>
                  ) : (
                    <>
                      <span className="text-white underline decoration-white/30">{item.url}</span>
                      {item.note && <span className="text-white/60"> — {item.note}</span>}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (question.type === "links") {
    return (
      <ul className="space-y-1.5">
        {(answer as BriefingLink[]).map((link, i) => (
          <li key={i} className="flex gap-2 text-[10.5px] leading-[1.5]">
            <span>+</span>
            <span className="min-w-0 break-words">
              {link.url && <span className="text-white underline decoration-white/30">{link.url}</span>}
              {link.url && link.note && <span className="text-white/35"> — </span>}
              {link.note && <span className="text-white/60">{link.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (Array.isArray(answer)) {
    return (
      <p className="flex flex-wrap gap-1.5">
        {(answer as string[]).map((option) => (
          <span key={option} className="bg-white px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-black">
            {option}
          </span>
        ))}
      </p>
    );
  }

  if (question.type === "single_choice") {
    return (
      <p>
        <span className="bg-white px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-black">{String(answer)}</span>
      </p>
    );
  }

  return <p className="whitespace-pre-line text-[10.5px] leading-[1.65] text-white/70">{String(answer).trim()}</p>;
}

export function BriefingDocument({
  briefing,
  includeNotes,
}: {
  briefing: BriefingExportData;
  includeNotes: boolean;
}) {
  const t = EXPORT_LABELS[briefing.language];
  const answered = briefing.questions.filter((q) => isAnswered(briefing.answers[q.id])).length;

  return (
    <article
      className="budget-document relative w-[800px] overflow-hidden bg-[#0a0a0a] font-sans text-white"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {/* Header */}
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
        <h1 className="text-[22px] font-bold uppercase tracking-[0.5em]">{briefingHeading(briefing)}</h1>
        <p className="mt-3 text-[10px] tracking-[0.5em] text-white/40">
          {briefing.code}
          {"  ·  "}
          {briefing.submittedAt
            ? `${t.sent.toUpperCase()} ${spaced(formatDate(briefing.submittedAt))}`
            : t.answered(answered, briefing.questions.length).toUpperCase()}
        </p>
      </header>

      {/* Sections */}
      <div className="relative mt-[48px] space-y-[44px] px-[72px]">
        {groupQuestions(briefing.questions).map((group, g) => (
          <section key={g}>
            <h2 className="flex items-baseline gap-3 border-b border-white/20 pb-3 text-[13px] font-medium uppercase tracking-[0.3em]">
              <span className="text-[11px] text-white/40">{String(g + 1).padStart(2, "0")}</span>
              <span>{topicLabel(group.topic, briefing.language)}</span>
            </h2>

            <div className="mt-6 space-y-[22px]">
              {group.items.map(({ question, number }) => {
                const note = includeNotes ? briefing.answerNotes[question.id]?.trim() : "";
                return (
                  <div key={question.id} className="flex gap-4 break-inside-avoid">
                    <span className="w-5 shrink-0 pt-[1px] text-[10px] tabular-nums text-white/35">
                      {String(number).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <h3 className="text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.08em]">
                        {question.title}
                      </h3>
                      <Answer question={question} answer={briefing.answers[question.id]} noAnswer={t.noAnswer} />
                      {note && (
                        <p className="whitespace-pre-line border-l border-white/40 pl-3 text-[9.5px] leading-[1.6] text-white/55">
                          <span className="font-bold uppercase tracking-[0.2em] text-white/80">{t.note}: </span>
                          {note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {includeNotes && briefing.internalNotes?.trim() && (
          <section className="break-inside-avoid">
            <h2 className="border-b border-white/20 pb-3 text-[13px] font-medium uppercase tracking-[0.3em]">
              {t.internalNotes}
            </h2>
            <p className="mt-6 whitespace-pre-line text-[10.5px] leading-[1.65] text-white/70">
              {briefing.internalNotes.trim()}
            </p>
          </section>
        )}
      </div>

      <div className="mt-[56px] flex justify-center">
        <img src="/budgets/studio-mark.svg" alt="" className="h-[22px]" />
      </div>

      <DocumentFooter />
    </article>
  );
}
