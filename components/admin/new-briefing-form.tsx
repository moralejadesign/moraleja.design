"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import type { Briefing, BriefingQuestion, BudgetLanguage } from "@/db/schema";
import { questionFromLibrary } from "@/lib/briefings";
import { fetchLibraryQuestions } from "./briefing-question-library";
import { fetchTemplates } from "./briefing-templates";

// A template id, every library question, or none
type Start = number | "library" | "empty";

type NewBriefingInput = {
  clientName: string;
  language: BudgetLanguage;
  start: Start;
};

async function createBriefing({ start, ...data }: NewBriefingInput): Promise<Briefing> {
  let questions: BriefingQuestion[] = [];
  if (start !== "empty") {
    let library = await fetchLibraryQuestions();
    if (typeof start === "number") {
      const template = (await fetchTemplates()).find((t) => t.id === start);
      const ids = new Set(template?.questionIds ?? []);
      library = library.filter((q) => ids.has(q.id));
    }
    questions = library.map((q) => questionFromLibrary(q, q.content[data.language]));
  }

  const res = await fetch("/api/briefings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, questions }),
  });
  if (!res.ok) throw new Error("Failed to create briefing");
  return res.json();
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-muted-foreground mb-1.5">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-3 text-left border transition-colors ${
              value === option.value
                ? "border-foreground bg-muted/50"
                : "border-border hover:border-foreground/30"
            }`}
          >
            <span className="block font-medium">{option.label}</span>
            {option.hint && <span className="block text-xs text-muted-foreground mt-0.5">{option.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NewBriefingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<NewBriefingInput>({
    clientName: "",
    language: "es",
    start: "library",
  });
  const [pickedStart, setPickedStart] = useState(false);

  const { data: templates } = useQuery({ queryKey: ["briefing-templates"], queryFn: fetchTemplates });

  // Default to the first template once they load, unless you already chose
  const start = pickedStart || !templates?.length ? formData.start : templates[0].id;

  const createMutation = useMutation({
    mutationFn: createBriefing,
    onSuccess: (briefing) => {
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      router.push(`/admin/briefings/${briefing.id}`);
    },
  });

  const update = <K extends keyof NewBriefingInput>(field: K, value: NewBriefingInput[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate({ ...formData, start });
      }}
      className="max-w-xl space-y-8"
    >
      <div className="flex items-center gap-4">
        <Link href="/admin/briefings" className="p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Briefing</h1>
      </div>

      <div className="space-y-6 p-6 border border-border">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Client</label>
          <input
            type="text"
            value={formData.clientName}
            onChange={(e) => update("clientName", e.target.value)}
            placeholder="Nudo, Home Game, Indigho…"
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
            autoFocus
            required
          />
        </div>

        <Choice
          label="Language"
          value={formData.language}
          onChange={(language) => update("language", language)}
          options={[
            { value: "es", label: "Español" },
            { value: "en", label: "English" },
          ]}
        />
        <Choice<Start>
          label="Start with"
          value={start}
          onChange={(value) => {
            setPickedStart(true);
            update("start", value);
          }}
          options={[
            ...(templates ?? []).map((t) => ({
              value: t.id,
              label: t.name,
              hint: `${t.questionIds.length} questions${t.description ? ` · ${t.description}` : ""}`,
            })),
            { value: "library", label: "All library questions", hint: "Then remove what you don't need" },
            { value: "empty", label: "No questions", hint: "Pick them one by one" },
          ]}
        />
        <p className="-mt-3 text-xs text-muted-foreground">
          <Link href="/admin/briefings/templates" className="underline hover:text-foreground">
            Manage templates
          </Link>
        </p>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-destructive">Couldn&apos;t create the briefing. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={createMutation.isPending || !formData.clientName.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Create and edit
      </button>
    </form>
  );
}
