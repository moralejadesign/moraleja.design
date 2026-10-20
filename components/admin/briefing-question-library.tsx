"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import type { BriefingLibraryQuestion, BriefingTopic, BudgetLanguage } from "@/db/schema";
import { BRIEFING_TOPICS, STARTER_QUESTIONS, emptyQuestionContent, questionTypeLabel } from "@/lib/briefings";
import { QuestionContentFields, QuestionSettings } from "./briefing-question-fields";

type QuestionInput = Pick<BriefingLibraryQuestion, "topic" | "type" | "required" | "content">;

export async function fetchLibraryQuestions(): Promise<BriefingLibraryQuestion[]> {
  const res = await fetch("/api/briefing-questions");
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json();
}

async function createQuestion(body: QuestionInput | { starter: true }) {
  const res = await fetch("/api/briefing-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create question");
  return res.json();
}

async function updateQuestion({ id, data }: { id: number; data: QuestionInput }) {
  const res = await fetch(`/api/briefing-questions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update question");
  return res.json();
}

async function deleteQuestion(id: number) {
  const res = await fetch(`/api/briefing-questions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete question");
}

export function BriefingQuestionLibrary() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<number | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["briefing-questions"] });

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ["briefing-questions"],
    queryFn: fetchLibraryQuestions,
  });

  const createMutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: (created) => {
      invalidate();
      if (!Array.isArray(created)) setOpenId(created.id);
    },
  });

  const deleteMutation = useMutation({ mutationFn: deleteQuestion, onSettled: invalidate });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load the library.</div>;
  }

  const addTo = (topic: BriefingTopic) =>
    createMutation.mutate({
      topic,
      type: "long_text",
      required: false,
      content: { es: emptyQuestionContent(), en: emptyQuestionContent() },
    });

  const libraryTitles = new Set(questions?.map((q) => q.content.es.title.trim()));
  const missingStarters = STARTER_QUESTIONS.filter((q) => !libraryTitles.has(q.content.es.title.trim()));

  return (
    <div className="space-y-8 max-w-4xl">
      {!!questions?.length && missingStarters.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border border-dashed border-border text-sm">
          <span className="text-muted-foreground">
            {missingStarters.length} Moraleja {missingStarters.length === 1 ? "question isn't" : "questions aren't"} in
            your library yet.
          </span>
          <button
            type="button"
            onClick={() => createMutation.mutate({ starter: true })}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Add them
          </button>
        </div>
      )}
      {!questions?.length && (
        <div className="p-6 border border-dashed border-border text-center space-y-3">
          <p className="text-muted-foreground">
            Start with a branding questionnaire in Spanish and English (business, audience,
            competition, personality sliders, visual references), then adjust it.
          </p>
          <button
            type="button"
            onClick={() => createMutation.mutate({ starter: true })}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Load Moraleja questions
          </button>
        </div>
      )}

      {!!questions?.length &&
        BRIEFING_TOPICS.map((topic) => {
          const inTopic = questions.filter((q) => q.topic === topic.value);
          return (
            <section key={topic.value} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold">
                  {topic.label.en} <span className="text-muted-foreground font-normal">{inTopic.length}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => addTo(topic.value)}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add question
                </button>
              </div>
              {inTopic.map((question) => (
                <div key={question.id} className="border border-border">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === question.id ? null : question.id)}
                      className="flex-1 flex items-center gap-2 min-w-0 text-left"
                    >
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${openId === question.id ? "rotate-90" : ""}`}
                      />
                      <span className="truncate">
                        {question.content.en.title || question.content.es.title || "Untitled question"}
                      </span>
                      {question.required && <span className="text-muted-foreground">*</span>}
                      <span className="ml-auto px-1.5 py-0.5 bg-muted text-muted-foreground text-xs shrink-0">
                        {questionTypeLabel(question.type)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this question from the library?")) deleteMutation.mutate(question.id);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {openId === question.id && <QuestionForm question={question} onSaved={invalidate} />}
                </div>
              ))}
              {inTopic.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2 border border-dashed border-border">
                  No questions in this section.
                </p>
              )}
            </section>
          );
        })}
    </div>
  );
}

function QuestionForm({ question, onSaved }: { question: BriefingLibraryQuestion; onSaved: () => void }) {
  const [data, setData] = useState<QuestionInput>({
    topic: question.topic,
    type: question.type,
    required: question.required,
    content: question.content,
  });
  const [language, setLanguage] = useState<BudgetLanguage>("es");
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: updateQuestion,
    onSuccess: () => {
      onSaved();
      setSaved(true);
    },
  });

  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timeout);
  }, [saved]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ id: question.id, data });
      }}
      className="space-y-4 p-4 border-t border-border"
    >
      <QuestionSettings
        topic={data.topic}
        type={data.type}
        required={data.required}
        onChange={(changes) => setData((prev) => ({ ...prev, ...changes }))}
      />

      <div className="flex gap-1 border-b border-border">
        {(["es", "en"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              language === lang
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang === "es" ? "Español" : "English"}
          </button>
        ))}
      </div>

      <QuestionContentFields
        type={data.type}
        content={data.content[language]}
        onChange={(changes) =>
          setData((prev) => ({
            ...prev,
            content: { ...prev.content, [language]: { ...prev.content[language], ...changes } },
          }))
        }
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save question
        </button>
        {saved && <span className="text-sm text-muted-foreground">Saved</span>}
        {mutation.isError && <span className="text-sm text-destructive">Save failed</span>}
      </div>
    </form>
  );
}
