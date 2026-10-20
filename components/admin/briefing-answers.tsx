"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, FileDown, FileText, Loader2, RefreshCw } from "lucide-react";
import type { BriefingAnswer, BriefingLink, BriefingQuestion } from "@/db/schema";
import { isImageUrl, isUploaded, topicLabel } from "@/lib/briefings";
import {
  answerPlainText,
  briefingFileName,
  briefingToMarkdown,
  groupQuestions,
  type BriefingExportData,
} from "@/lib/briefing-export";
import { ScaledBudget, printBudgetDocument } from "@/components/budget-viewer";
import { BriefingDocument } from "./briefing-document";
import { inputClass } from "./briefing-question-fields";

function downloadText(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** The client's answers with your private notes, plus Markdown and PDF export. */
export function BriefingAnswers({
  briefing,
  onNoteChange,
  onRefresh,
  refreshing,
}: {
  briefing: BriefingExportData;
  onNoteChange: (questionId: string, note: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [includeNotes, setIncludeNotes] = useState(true);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const fileName = briefingFileName(briefing);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const markdown = () => briefingToMarkdown(briefing, { includeNotes });

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_auto] gap-8 items-start">
      <div className="space-y-6 min-w-0 print:hidden">
        {/* Export */}
        <div className="space-y-4 p-6 border border-border">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">Export</h2>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Load the client's latest answers"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh answers
            </button>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(e) => setIncludeNotes(e.target.checked)}
              className="w-4 h-4"
            />
            <span>
              <span className="font-medium">Include my notes</span>
              <span className="block text-xs text-muted-foreground">
                Your notes per answer and the internal notes. Turn off before sharing the file.
              </span>
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(markdown());
                setCopied(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Markdown"}
            </button>
            <button
              type="button"
              onClick={() => downloadText(markdown(), `${fileName}.md`)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
            >
              <FileText className="h-4 w-4" />
              Download .md
            </button>
            <button
              type="button"
              onClick={() => printBudgetDocument(printRef.current, fileName)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Answers with notes */}
        {groupQuestions(briefing.questions).map((group, g) => (
          <div key={g} className="space-y-3 p-6 border border-border">
            <h2 className="font-semibold">{topicLabel(group.topic, briefing.language)}</h2>
            {group.items.map(({ question, number }) => (
              <AnswerRow
                key={question.id}
                question={question}
                number={number}
                answer={briefing.answers[question.id]}
                note={briefing.answerNotes[question.id] ?? ""}
                onNoteChange={(note) => onNoteChange(question.id, note)}
              />
            ))}
          </div>
        ))}
        {briefing.questions.length === 0 && (
          <p className="text-sm text-muted-foreground p-6 border border-dashed border-border text-center">
            This briefing has no questions yet.
          </p>
        )}
      </div>

      {/* Preview; also what gets printed */}
      {/* Scrolls on its own: a long briefing is much taller than the window */}
      <div
        ref={printRef}
        className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto print:static print:max-h-none print:overflow-visible"
      >
        <ScaledBudget scale={0.6} className="border border-border print:border-0">
          <BriefingDocument briefing={briefing} includeNotes={includeNotes} />
        </ScaledBudget>
        {refreshing && (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground print:hidden">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading answers…
          </p>
        )}
      </div>
    </div>
  );
}

function AnswerRow({
  question,
  number,
  answer,
  note,
  onNoteChange,
}: {
  question: BriefingQuestion;
  number: number;
  answer: BriefingAnswer | undefined;
  note: string;
  onNoteChange: (note: string) => void;
}) {
  const [showNote, setShowNote] = useState(note !== "");
  const text = answerPlainText(question, answer);

  return (
    <div className="pt-3 border-t border-border first-of-type:border-t-0 first-of-type:pt-0 space-y-2">
      <p className="flex gap-2 text-sm font-medium">
        <span className="text-muted-foreground tabular-nums">{number}.</span>
        <span>
          {question.title}
          {question.required && <span className="text-muted-foreground"> *</span>}
        </span>
      </p>
      {question.type === "files" && Array.isArray(answer) ? (
        <FileList items={answer as BriefingLink[]} />
      ) : (
        <p className={`pl-6 text-sm whitespace-pre-line break-words ${text ? "" : "text-muted-foreground italic"}`}>
          {text ?? "No answer"}
        </p>
      )}
      <div className="pl-6">
        {showNote ? (
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Your note: what this means for the brand, follow-up questions…"
            rows={2}
            autoFocus={note === ""}
            className={`${inputClass} resize-y text-sm`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Add note
          </button>
        )}
      </div>
    </div>
  );
}

/** Uploaded images as thumbnails, other files and links as a list; all open in a new tab. */
function FileList({ items }: { items: BriefingLink[] }) {
  const images = items.filter((item) => isUploaded(item) && isImageUrl(item.url));
  const others = items.filter((item) => !images.includes(item));

  return (
    <div className="pl-6 space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((image) => (
            <a key={image.url} href={image.url} target="_blank" rel="noopener noreferrer" title={image.note}>
              {/* eslint-disable-next-line @next/next/no-img-element -- client uploads, any size */}
              <img src={image.url} alt={image.note} className="aspect-square w-full object-cover border border-border" />
            </a>
          ))}
        </div>
      )}
      {others.map((item, i) => (
        <p key={i} className="text-sm break-words">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
            {isUploaded(item) ? item.note || item.url : item.url}
          </a>
          {!isUploaded(item) && item.note && <span className="text-muted-foreground"> — {item.note}</span>}
        </p>
      ))}
    </div>
  );
}
