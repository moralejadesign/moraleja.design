"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Check,
  Cloud,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Library,
  RotateCcw,
  Unlock,
} from "lucide-react";
import type { Briefing, BriefingQuestion, BriefingStatus } from "@/db/schema";
import {
  BRIEFING_STATUSES,
  BRIEFING_TOPICS,
  DEFAULT_INTRO,
  answeredCount,
  briefingHeading,
  emptyQuestion,
  questionFromLibrary,
  questionTypeLabel,
  topicLabel,
} from "@/lib/briefings";
import {
  BRIEFING_STATUS_STYLES,
  QuestionContentFields,
  QuestionSettings,
  inputClass,
  labelClass,
} from "./briefing-question-fields";
import { fetchLibraryQuestions } from "./briefing-question-library";
import { BriefingAnswers } from "./briefing-answers";
import { BriefingSharePanel } from "./share-panel";

type BriefingInput = Pick<
  Briefing,
  "clientName" | "title" | "language" | "status" | "intro" | "questions" | "answerNotes" | "internalNotes"
>;

type SaveStatus = "idle" | "saving" | "saved" | "error";

function toInput(briefing: Briefing): BriefingInput {
  return {
    clientName: briefing.clientName,
    title: briefing.title,
    language: briefing.language,
    status: briefing.status,
    intro: briefing.intro,
    questions: briefing.questions,
    answerNotes: briefing.answerNotes,
    internalNotes: briefing.internalNotes,
  };
}

async function fetchBriefing(id: number): Promise<Briefing> {
  const res = await fetch(`/api/briefings/${id}`);
  if (!res.ok) throw new Error("Failed to fetch briefing");
  return res.json();
}

/** Sends only changed fields, so a save never overwrites what the client changed (status). */
async function updateBriefing({ id, data }: { id: number; data: Partial<BriefingInput> }): Promise<Briefing> {
  const res = await fetch(`/api/briefings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update briefing");
  return res.json();
}

async function reopenBriefing(id: number): Promise<Briefing> {
  const res = await fetch(`/api/briefings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reopen: true }),
  });
  if (!res.ok) throw new Error("Failed to reopen briefing");
  return res.json();
}

export function BriefingEditor({ briefing: initial }: { briefing: Briefing }) {
  // Latest copy from the server: answers and submission change outside this form
  const [briefing, setBriefing] = useState(initial);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BriefingInput>(() => toInput(briefing));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [tab, setTab] = useState<"questions" | "answers">(initial.startedAt ? "answers" : "questions");
  const lastSaved = useRef(JSON.stringify(toInput(initial)));
  const hasChanges = JSON.stringify(formData) !== lastSaved.current;
  const answered = answeredCount(briefing);

  const { data: library } = useQuery({ queryKey: ["briefing-questions"], queryFn: fetchLibraryQuestions });

  const updateMutation = useMutation({
    mutationFn: updateBriefing,
    onMutate: () => setSaveStatus("saving"),
    onError: () => setSaveStatus("error"),
    onSuccess: (saved, { data }) => {
      lastSaved.current = JSON.stringify({ ...JSON.parse(lastSaved.current), ...data });
      setBriefing(saved);
      queryClient.setQueryData(["briefing", String(briefing.id)], saved);
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      setSaveStatus("saved");
    },
  });

  // Takes answers and status from the server; local edits that aren't saved yet stay pending
  const syncFromServer = (fresh: Briefing) => {
    setBriefing(fresh);
    queryClient.setQueryData(["briefing", String(fresh.id)], fresh);
    queryClient.invalidateQueries({ queryKey: ["briefings"] });
    const saved = JSON.parse(lastSaved.current) as BriefingInput;
    if (formData.status === saved.status) {
      lastSaved.current = JSON.stringify({ ...saved, status: fresh.status });
      setFormData((prev) => ({ ...prev, status: fresh.status }));
    }
  };

  const reopenMutation = useMutation({ mutationFn: reopenBriefing, onSuccess: syncFromServer });
  const refreshMutation = useMutation({ mutationFn: fetchBriefing, onSuccess: syncFromServer });

  const showTab = (next: typeof tab) => {
    setTab(next);
    if (next === "answers") refreshMutation.mutate(briefing.id);
  };

  // Autosave a second after the last change
  useEffect(() => {
    if (!hasChanges || updateMutation.isPending) return;
    const timeout = setTimeout(() => {
      const saved = JSON.parse(lastSaved.current) as BriefingInput;
      const changed = Object.fromEntries(
        Object.entries(formData).filter(
          ([key, value]) => JSON.stringify(value) !== JSON.stringify(saved[key as keyof BriefingInput])
        )
      ) as Partial<BriefingInput>;
      // Same values in a different key order: nothing to send
      if (Object.keys(changed).length === 0) {
        lastSaved.current = JSON.stringify(formData);
        return;
      }
      updateMutation.mutate({ id: briefing.id, data: changed });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData, hasChanges, briefing.id, updateMutation.isPending]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timeout = setTimeout(() => setSaveStatus("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [saveStatus]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const update = <K extends keyof BriefingInput>(field: K, value: BriefingInput[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Swap an untouched default intro when the language changes
  const changeLanguage = (language: BriefingInput["language"]) =>
    setFormData((prev) => ({
      ...prev,
      language,
      intro: prev.intro === DEFAULT_INTRO[prev.language] ? DEFAULT_INTRO[language] : prev.intro,
    }));

  const updateQuestion = (id: string, changes: Partial<BriefingQuestion>) =>
    update(
      "questions",
      formData.questions.map((q) => (q.id === id ? { ...q, ...changes } : q))
    );

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const questions = [...formData.questions];
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    [questions[index], questions[target]] = [questions[target], questions[index]];
    update("questions", questions);
  };

  // New questions go after the last one of their section, keeping sections together
  const addQuestion = (question: BriefingQuestion) => {
    const questions = [...formData.questions];
    const lastOfTopic = questions.findLastIndex((q) => q.topic === question.topic);
    const topicOrder = BRIEFING_TOPICS.findIndex((t) => t.value === question.topic);
    const insertAt =
      lastOfTopic >= 0
        ? lastOfTopic + 1
        : questions.findIndex(
            (q) => BRIEFING_TOPICS.findIndex((t) => t.value === q.topic) > topicOrder
          );
    questions.splice(insertAt === -1 ? questions.length : insertAt, 0, question);
    update("questions", questions);
    setOpenQuestion(question.id);
  };

  const sortBySection = () =>
    update(
      "questions",
      [...formData.questions].sort(
        (a, b) =>
          BRIEFING_TOPICS.findIndex((t) => t.value === a.topic) -
          BRIEFING_TOPICS.findIndex((t) => t.value === b.topic)
      )
    );

  // Library titles already in this briefing, to mark them in the picker
  const usedTitles = new Set(formData.questions.map((q) => q.title.trim()));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/admin/briefings" className="p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {formData.clientName || "Untitled"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {briefing.code} · {answered}/{formData.questions.length} answered
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === "error" && <span className="text-destructive">Save failed</span>}
            {saveStatus === "idle" && hasChanges && (
              <>
                <Cloud className="h-3.5 w-3.5" />
                <span>Unsaved</span>
              </>
            )}
          </div>
          <select
            value={formData.status}
            onChange={(e) => update("status", e.target.value as BriefingStatus)}
            className={`px-3 py-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-foreground/20 ${BRIEFING_STATUS_STYLES[formData.status]}`}
            aria-label="Status"
          >
            {BRIEFING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border print:hidden">
        {(
          [
            ["questions", `Questions (${formData.questions.length})`],
            ["answers", `Answers (${answered}/${formData.questions.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => showTab(value)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              tab === value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "answers" && (
        <BriefingAnswers
          briefing={{ ...briefing, ...formData }}
          onNoteChange={(id, note) =>
            setFormData((prev) => {
              const answerNotes = { ...prev.answerNotes };
              if (note) answerNotes[id] = note;
              else delete answerNotes[id];
              return { ...prev, answerNotes };
            })
          }
          onRefresh={() => refreshMutation.mutate(briefing.id)}
          refreshing={refreshMutation.isPending}
        />
      )}

      {tab === "questions" && (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
          {/* Form */}
          <div className="space-y-6 min-w-0">
            <div className="space-y-4 p-6 border border-border">
              <h2 className="font-semibold">Basics</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Client</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => update("clientName", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Heading</label>
                  <input
                    type="text"
                    value={formData.title ?? ""}
                    onChange={(e) => update("title", e.target.value || null)}
                    placeholder={briefingHeading({ ...formData, title: null })}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => changeLanguage(e.target.value as BriefingInput["language"])}
                    className={inputClass}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Questions added from the library use this language. Changing it doesn&apos;t
                    translate questions already added.
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-4 mb-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Welcome message</label>
                  {formData.intro !== DEFAULT_INTRO[formData.language] && (
                    <button
                      type="button"
                      onClick={() => update("intro", DEFAULT_INTRO[formData.language])}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Default
                    </button>
                  )}
                </div>
                <textarea
                  value={formData.intro ?? ""}
                  onChange={(e) => update("intro", e.target.value || null)}
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  The first thing the client reads, before the questions.
                </p>
              </div>
            </div>

            {briefing.submittedAt && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border border-green-500/30 bg-green-500/5 text-sm">
                <span>
                  Sent by the client on {new Date(briefing.submittedAt).toLocaleString("es-CO")}. Their answers are
                  locked.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Reopen the briefing so the client can change their answers?")) {
                      reopenMutation.mutate(briefing.id);
                    }
                  }}
                  disabled={reopenMutation.isPending}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {reopenMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                  Reopen
                </button>
              </div>
            )}

            <BriefingSharePanel briefing={briefing} onUpdated={setBriefing} />

            {/* Questions */}
            <div className="space-y-4 p-6 border border-border">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold">
                  Questions <span className="text-muted-foreground font-normal">{formData.questions.length}</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLibrary((v) => !v)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border transition-colors ${
                      showLibrary ? "border-foreground" : "border-border hover:bg-muted"
                    }`}
                  >
                    <Library className="h-4 w-4" />
                    From library
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion(emptyQuestion(openTopic(formData.questions, openQuestion)))}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Blank
                  </button>
                </div>
              </div>

              {showLibrary && (
                <div className="p-3 bg-muted/30 border border-border space-y-3 max-h-[420px] overflow-y-auto">
                  {!library?.length ? (
                    <p className="text-sm text-muted-foreground p-2">
                      The library is empty.{" "}
                      <Link href="/admin/briefings/questions" className="underline hover:text-foreground">
                        Set it up
                      </Link>
                    </p>
                  ) : (
                    BRIEFING_TOPICS.map((topic) => {
                      const inTopic = library.filter((q) => q.topic === topic.value);
                      if (!inTopic.length) return null;
                      return (
                        <div key={topic.value}>
                          <p className="px-3 pb-1 text-xs uppercase tracking-wider text-muted-foreground">
                            {topic.label.en}
                          </p>
                          {inTopic.map((q) => {
                            const content = q.content[formData.language];
                            const used = usedTitles.has(content.title.trim());
                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => addQuestion(questionFromLibrary(q, content))}
                                className="w-full flex items-center justify-between gap-4 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  {used ? (
                                    <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                                  ) : (
                                    <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  )}
                                  <span className={`truncate ${used ? "text-muted-foreground" : ""}`}>
                                    {content.title || "Untitled question"}
                                  </span>
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {questionTypeLabel(q.type)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              <div className="space-y-2">
                {formData.questions.map((question, i) => {
                  const isOpen = openQuestion === question.id;
                  const startsTopic = i === 0 || formData.questions[i - 1].topic !== question.topic;
                  return (
                    <div key={question.id}>
                      {startsTopic && (
                        <p className="pt-2 pb-1 text-xs uppercase tracking-wider text-muted-foreground">
                          {topicLabel(question.topic, formData.language)}
                        </p>
                      )}
                      <div className="border border-border">
                        <div className="flex items-center gap-2 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setOpenQuestion(isOpen ? null : question.id)}
                            className="flex-1 flex items-center gap-2 min-w-0 text-left"
                          >
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                            />
                            <span className="text-muted-foreground tabular-nums shrink-0">{i + 1}.</span>
                            <span className="truncate">{question.title || "Untitled question"}</span>
                            {question.required && <span className="text-muted-foreground">*</span>}
                            <span className="ml-auto px-1.5 py-0.5 bg-muted text-muted-foreground text-xs shrink-0">
                              {questionTypeLabel(question.type)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuestion(i, -1)}
                            disabled={i === 0}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuestion(i, 1)}
                            disabled={i === formData.questions.length - 1}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const hasAnswer = briefing.answers[question.id] !== undefined;
                              if (
                                !hasAnswer ||
                                confirm("The client already answered this question. Remove it and its answer?")
                              ) {
                                update(
                                  "questions",
                                  formData.questions.filter((q) => q.id !== question.id)
                                );
                              }
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {isOpen && (
                          <div className="space-y-4 p-4 border-t border-border">
                            <QuestionSettings
                              topic={question.topic}
                              type={question.type}
                              required={question.required}
                              onChange={(changes) => updateQuestion(question.id, changes)}
                            />
                            <QuestionContentFields
                              type={question.type}
                              content={question}
                              onChange={(changes) => updateQuestion(question.id, changes)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {formData.questions.length === 0 && (
                  <p className="text-sm text-muted-foreground p-4 border border-dashed border-border text-center">
                    No questions yet. Add them from the library or start a blank one.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 p-6 border border-border">
              <h2 className="font-semibold">Internal notes</h2>
              <textarea
                value={formData.internalNotes ?? ""}
                onChange={(e) => update("internalNotes", e.target.value || null)}
                placeholder="Only you see this: context from the first call, who referred them…"
                rows={3}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {/* Outline: the order the client will see */}
          <aside className="xl:sticky xl:top-20 space-y-4 p-6 border border-border">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">Outline</h2>
              {isOutOfOrder(formData.questions) && (
                <button
                  type="button"
                  onClick={sortBySection}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Group by section
                </button>
              )}
            </div>
            <p className="text-xs uppercase tracking-[0.3em]">{briefingHeading(formData)}</p>
            <ol className="space-y-3 text-sm">
              {groupByTopic(formData.questions).map((group, g) => (
                <li key={g}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    {topicLabel(group.topic, formData.language)}
                  </p>
                  <ol className="space-y-0.5">
                    {group.questions.map(({ question, index }) => (
                      <li key={question.id}>
                        <button
                          type="button"
                          onClick={() => setOpenQuestion(question.id)}
                          className={`w-full flex gap-2 text-left hover:text-foreground ${
                            openQuestion === question.id ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          <span className="tabular-nums shrink-0">{index + 1}.</span>
                          <span className="truncate">{question.title || "Untitled question"}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              {formData.questions.filter((q) => q.required).length} required ·{" "}
              {formData.questions.length} total
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

/** Section of the open question, so a blank question lands next to it. */
function openTopic(questions: BriefingQuestion[], openId: string | null) {
  return questions.find((q) => q.id === openId)?.topic ?? questions.at(-1)?.topic ?? "business";
}

/** Consecutive runs of the same section, as the client will see them. */
function groupByTopic(questions: BriefingQuestion[]) {
  const groups: { topic: BriefingQuestion["topic"]; questions: { question: BriefingQuestion; index: number }[] }[] = [];
  questions.forEach((question, index) => {
    const last = groups.at(-1);
    if (last?.topic === question.topic) last.questions.push({ question, index });
    else groups.push({ topic: question.topic, questions: [{ question, index }] });
  });
  return groups;
}

function isOutOfOrder(questions: BriefingQuestion[]) {
  return new Set(questions.map((q) => q.topic)).size !== groupByTopic(questions).length;
}
