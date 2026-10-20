"use client";

import type {
  BriefingQuestionContent,
  BriefingQuestionType,
  BriefingTopic,
} from "@/db/schema";
import { BRIEFING_TOPICS, QUESTION_TYPES, isChoiceType } from "@/lib/briefings";

export const inputClass =
  "w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20";
export const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

export const BRIEFING_STATUS_STYLES = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-400",
  completed: "bg-green-500/10 text-green-400",
} as const;

/** Topic, type and required: the settings shared by every language. */
export function QuestionSettings({
  topic,
  type,
  required,
  onChange,
}: {
  topic: BriefingTopic;
  type: BriefingQuestionType;
  required: boolean;
  onChange: (changes: { topic?: BriefingTopic; type?: BriefingQuestionType; required?: boolean }) => void;
}) {
  return (
    <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
      <div>
        <label className={labelClass}>Section</label>
        <select
          value={topic}
          onChange={(e) => onChange({ topic: e.target.value as BriefingTopic })}
          className={inputClass}
        >
          {BRIEFING_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label.en}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Answer type</label>
        <select
          value={type}
          onChange={(e) => onChange({ type: e.target.value as BriefingQuestionType })}
          className={inputClass}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 py-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="w-4 h-4"
        />
        Required
      </label>
    </div>
  );
}

/** The wording of a question in one language; extra fields depend on the type. */
export function QuestionContentFields({
  type,
  content,
  onChange,
}: {
  type: BriefingQuestionType;
  content: BriefingQuestionContent;
  onChange: (changes: Partial<BriefingQuestionContent>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Question</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>
          Help text <span className="text-xs">(optional, shown under the question)</span>
        </label>
        <input
          type="text"
          value={content.help}
          onChange={(e) => onChange({ help: e.target.value })}
          className={inputClass}
        />
      </div>
      {isChoiceType(type) && (
        <div>
          <label className={labelClass}>
            Options <span className="text-xs">(one per line)</span>
          </label>
          <textarea
            value={content.options.join("\n")}
            onChange={(e) => onChange({ options: e.target.value.split("\n") })}
            rows={Math.max(3, content.options.length + 1)}
            className={`${inputClass} resize-y`}
          />
        </div>
      )}
      {type === "slider" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Left word</label>
            <input
              type="text"
              value={content.minLabel}
              onChange={(e) => onChange({ minLabel: e.target.value })}
              placeholder="Classic"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Right word</label>
            <input
              type="text"
              value={content.maxLabel}
              onChange={(e) => onChange({ maxLabel: e.target.value })}
              placeholder="Modern"
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}
