"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import type { BriefingLibraryQuestion, BriefingTemplate } from "@/db/schema";
import { BRIEFING_TOPICS, questionTypeLabel } from "@/lib/briefings";
import { fetchLibraryQuestions } from "./briefing-question-library";
import { inputClass, labelClass } from "./briefing-question-fields";

type TemplateInput = Pick<BriefingTemplate, "name" | "description" | "questionIds">;

export async function fetchTemplates(): Promise<BriefingTemplate[]> {
  const res = await fetch("/api/briefing-templates");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

async function createTemplate(body: TemplateInput | { starter: true }) {
  const res = await fetch("/api/briefing-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create template");
  return res.json();
}

async function updateTemplate({ id, data }: { id: number; data: TemplateInput }) {
  const res = await fetch(`/api/briefing-templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update template");
  return res.json();
}

async function deleteTemplate(id: number) {
  const res = await fetch(`/api/briefing-templates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete template");
}

/** Library questions still in this template; ids of deleted questions are ignored. */
export function templateQuestions(template: Pick<BriefingTemplate, "questionIds">, library: BriefingLibraryQuestion[]) {
  const ids = new Set(template.questionIds);
  return library.filter((q) => ids.has(q.id));
}

export function BriefingTemplates() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<number | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["briefing-templates"] });

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["briefing-templates"],
    queryFn: fetchTemplates,
  });
  const { data: library } = useQuery({ queryKey: ["briefing-questions"], queryFn: fetchLibraryQuestions });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: (created) => {
      invalidate();
      if (!Array.isArray(created)) setOpenId(created.id);
    },
  });

  const deleteMutation = useMutation({ mutationFn: deleteTemplate, onSettled: invalidate });

  if (isLoading || !library) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load templates.</div>;
  }

  if (!library.length) {
    return (
      <p className="max-w-4xl p-6 border border-dashed border-border text-center text-muted-foreground">
        Templates are built from the question library, which is empty.{" "}
        <Link href="/admin/briefings/questions" className="underline hover:text-foreground">
          Set it up first
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {!templates?.length && (
        <div className="p-6 border border-dashed border-border text-center space-y-3">
          <p className="text-muted-foreground">
            Start with three templates: New brand, Rebrand and Quick logo. You can change them afterwards.
          </p>
          <button
            type="button"
            onClick={() => createMutation.mutate({ starter: true })}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Load Moraleja templates
          </button>
        </div>
      )}

      <div className="space-y-2">
        {templates?.map((template) => (
          <div key={template.id} className="border border-border">
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => setOpenId(openId === template.id ? null : template.id)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left"
              >
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform ${openId === template.id ? "rotate-90" : ""}`}
                />
                <span className="truncate font-medium">{template.name}</span>
                <span className="ml-auto text-sm text-muted-foreground tabular-nums shrink-0">
                  {templateQuestions(template, library).length} questions
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete the "${template.name}" template? Briefings made from it stay as they are.`)) {
                    deleteMutation.mutate(template.id);
                  }
                }}
                className="p-1.5 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {openId === template.id && <TemplateForm template={template} library={library} onSaved={invalidate} />}
          </div>
        ))}
      </div>

      {!!templates?.length && (
        <button
          type="button"
          onClick={() => createMutation.mutate({ name: "New template", description: null, questionIds: [] })}
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New template
        </button>
      )}
    </div>
  );
}

function TemplateForm({
  template,
  library,
  onSaved,
}: {
  template: BriefingTemplate;
  library: BriefingLibraryQuestion[];
  onSaved: () => void;
}) {
  const [data, setData] = useState<TemplateInput>({
    name: template.name,
    description: template.description,
    // Drop ids of questions deleted from the library
    questionIds: templateQuestions(template, library).map((q) => q.id),
  });
  const [saved, setSaved] = useState(false);
  const selected = new Set(data.questionIds);

  const mutation = useMutation({
    mutationFn: updateTemplate,
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

  // Kept in library order, so briefings list questions section by section
  const setSelected = (ids: Set<number>) =>
    setData((prev) => ({ ...prev, questionIds: library.filter((q) => ids.has(q.id)).map((q) => q.id) }));

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ id: template.id, data });
      }}
      className="space-y-5 p-4 border-t border-border"
    >
      <div className="grid sm:grid-cols-[1fr_2fr] gap-4">
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={data.description ?? ""}
            onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value || null }))}
            placeholder="When to use it"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-4">
        {BRIEFING_TOPICS.map((topic) => {
          const inTopic = library.filter((q) => q.topic === topic.value);
          if (!inTopic.length) return null;
          const all = inTopic.every((q) => selected.has(q.id));
          return (
            <div key={topic.value}>
              <div className="flex items-center justify-between gap-4 mb-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {topic.label.en}{" "}
                  <span className="normal-case tracking-normal">
                    {inTopic.filter((q) => selected.has(q.id)).length}/{inTopic.length}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(selected);
                    inTopic.forEach((q) => (all ? next.delete(q.id) : next.add(q.id)));
                    setSelected(next);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {all ? "Clear section" : "Select all"}
                </button>
              </div>
              {inTopic.map((q) => (
                <label
                  key={q.id}
                  className="flex items-center gap-3 px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(q.id)}
                    onChange={() => toggle(q.id)}
                    className="w-4 h-4 shrink-0"
                  />
                  <span className={`flex-1 min-w-0 truncate ${selected.has(q.id) ? "" : "text-muted-foreground"}`}>
                    {q.content.en.title || q.content.es.title || "Untitled question"}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{questionTypeLabel(q.type)}</span>
                </label>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save template
        </button>
        <span className="text-sm text-muted-foreground">{data.questionIds.length} questions</span>
        {saved && <span className="text-sm text-muted-foreground">Saved</span>}
        {mutation.isError && <span className="text-sm text-destructive">Save failed</span>}
      </div>
    </form>
  );
}
