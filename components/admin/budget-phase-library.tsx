"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import type { BudgetCurrency, BudgetLanguage, BudgetPhase, BudgetPhaseContent } from "@/db/schema";

type PhaseInput = Pick<BudgetPhase, "name" | "content" | "defaultPrice">;

const emptyContent = (): BudgetPhaseContent => ({
  title: "",
  description: "",
  bullets: [],
  deliverable: "",
  includes: "",
  duration: "",
});

const inputClass =
  "w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20";
const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

async function fetchPhases(): Promise<BudgetPhase[]> {
  const res = await fetch("/api/budget-phases");
  if (!res.ok) throw new Error("Failed to fetch phases");
  return res.json();
}

async function createPhase(body: PhaseInput | { starter: true }) {
  const res = await fetch("/api/budget-phases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create phase");
  return res.json();
}

async function updatePhase({ id, data }: { id: number; data: PhaseInput }) {
  const res = await fetch(`/api/budget-phases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update phase");
  return res.json();
}

async function deletePhase(id: number) {
  const res = await fetch(`/api/budget-phases/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete phase");
}

export function BudgetPhaseLibrary() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<number | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["budget-phases"] });

  const { data: phases, isLoading, error } = useQuery({
    queryKey: ["budget-phases"],
    queryFn: fetchPhases,
  });

  const createMutation = useMutation({
    mutationFn: createPhase,
    onSuccess: (created) => {
      invalidate();
      if (!Array.isArray(created)) setOpenId(created.id);
    },
  });

  const deleteMutation = useMutation({ mutationFn: deletePhase, onSettled: invalidate });

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

  return (
    <div className="space-y-4 max-w-4xl">
      {!phases?.length && (
        <div className="p-6 border border-dashed border-border text-center space-y-3">
          <p className="text-muted-foreground">
            Start with the phases from your 2026 budgets (Home Game, Indigho, Scalaty, Nudo) in
            Spanish and English, then adjust them.
          </p>
          <button
            type="button"
            onClick={() => createMutation.mutate({ starter: true })}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Load Moraleja phases
          </button>
        </div>
      )}

      <div className="space-y-2">
        {phases?.map((phase) => (
          <div key={phase.id} className="border border-border">
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => setOpenId(openId === phase.id ? null : phase.id)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left"
              >
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform ${openId === phase.id ? "rotate-90" : ""}`}
                />
                <span className="truncate font-medium">{phase.name}</span>
                <span className="ml-auto text-sm text-muted-foreground tabular-nums shrink-0">
                  {(["USD", "COP"] as const)
                    .filter((c) => phase.defaultPrice[c] != null)
                    .map((c) => `${c} ${phase.defaultPrice[c]!.toLocaleString(c === "COP" ? "es-CO" : "en-US")}`)
                    .join(" · ")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${phase.name}" from the library?`)) deleteMutation.mutate(phase.id);
                }}
                className="p-1.5 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {openId === phase.id && <PhaseForm phase={phase} onSaved={invalidate} />}
          </div>
        ))}
      </div>

      {!!phases?.length && (
        <button
          type="button"
          onClick={() =>
            createMutation.mutate({
              name: "New phase",
              content: { es: emptyContent(), en: emptyContent() },
              defaultPrice: {},
            })
          }
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New phase
        </button>
      )}
    </div>
  );
}

function PhaseForm({ phase, onSaved }: { phase: BudgetPhase; onSaved: () => void }) {
  const [data, setData] = useState<PhaseInput>({
    name: phase.name,
    content: phase.content,
    defaultPrice: phase.defaultPrice,
  });
  const [language, setLanguage] = useState<BudgetLanguage>("es");
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: updatePhase,
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

  const content = data.content[language];
  const updateContent = (changes: Partial<BudgetPhaseContent>) =>
    setData((prev) => ({
      ...prev,
      content: { ...prev.content, [language]: { ...prev.content[language], ...changes } },
    }));
  const updatePrice = (currency: BudgetCurrency, value: string) =>
    setData((prev) => {
      const defaultPrice = { ...prev.defaultPrice };
      const n = Number(value.replace(/[^\d.]/g, ""));
      if (value.trim() === "" || Number.isNaN(n)) delete defaultPrice[currency];
      else defaultPrice[currency] = n;
      return { ...prev, defaultPrice };
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ id: phase.id, data });
      }}
      className="space-y-4 p-4 border-t border-border"
    >
      <div className="grid sm:grid-cols-[1fr_140px_140px] gap-4">
        <div>
          <label className={labelClass}>Library name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
        {(["USD", "COP"] as const).map((currency) => (
          <div key={currency}>
            <label className={labelClass}>Default {currency}</label>
            <input
              type="text"
              inputMode="decimal"
              value={data.defaultPrice[currency] ?? ""}
              onChange={(e) => updatePrice(currency, e.target.value)}
              placeholder="Optional"
              className={`${inputClass} tabular-nums`}
            />
          </div>
        ))}
      </div>

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

      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => updateContent({ title: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={content.description}
          onChange={(e) => updateContent({ description: e.target.value })}
          rows={4}
          className={`${inputClass} resize-y`}
        />
      </div>
      <div>
        <label className={labelClass}>
          Bullet points <span className="text-xs">(one per line)</span>
        </label>
        <textarea
          value={content.bullets.join("\n")}
          onChange={(e) => updateContent({ bullets: e.target.value.split("\n") })}
          rows={Math.max(2, content.bullets.length + 1)}
          className={`${inputClass} resize-y`}
        />
      </div>
      <div>
        <label className={labelClass}>Deliverable</label>
        <input
          type="text"
          value={content.deliverable}
          onChange={(e) => updateContent({ deliverable: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Includes</label>
          <input
            type="text"
            value={content.includes}
            onChange={(e) => updateContent({ includes: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Estimated duration</label>
          <input
            type="text"
            value={content.duration}
            onChange={(e) => updateContent({ duration: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save phase
        </button>
        {saved && <span className="text-sm text-muted-foreground">Saved</span>}
        {mutation.isError && <span className="text-sm text-destructive">Save failed</span>}
      </div>
    </form>
  );
}
