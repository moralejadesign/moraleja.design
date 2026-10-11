"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import type { Budget, BudgetCurrency, BudgetKind, BudgetLanguage } from "@/db/schema";

type NewBudgetInput = {
  clientName: string;
  kind: BudgetKind;
  language: BudgetLanguage;
  currency: BudgetCurrency;
};

async function createBudget(data: NewBudgetInput): Promise<Budget> {
  const res = await fetch("/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create budget");
  return res.json();
}

function Choice<T extends string>({
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

export function NewBudgetForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<NewBudgetInput>({
    clientName: "",
    kind: "project",
    language: "es",
    currency: "USD",
  });

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: (budget) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      router.push(`/admin/budgets/${budget.id}`);
    },
  });

  const update = <K extends keyof NewBudgetInput>(field: K, value: NewBudgetInput[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate(formData);
      }}
      className="max-w-xl space-y-8"
    >
      <div className="flex items-center gap-4">
        <Link href="/admin/budgets" className="p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Budget</h1>
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
          label="Type"
          value={formData.kind}
          onChange={(kind) => update("kind", kind)}
          options={[
            { value: "project", label: "Project", hint: "Numbered phases + total" },
            { value: "retainer", label: "Monthly fee", hint: "Service, scope, price per month" },
          ]}
        />
        <Choice
          label="Language"
          value={formData.language}
          onChange={(language) => update("language", language)}
          options={[
            { value: "es", label: "Español" },
            { value: "en", label: "English" },
          ]}
        />
        <Choice
          label="Currency"
          value={formData.currency}
          onChange={(currency) => update("currency", currency)}
          options={[
            { value: "USD", label: "USD" },
            { value: "COP", label: "COP" },
          ]}
        />
      </div>

      {createMutation.isError && (
        <p className="text-sm text-destructive">Couldn&apos;t create the budget. Please try again.</p>
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
