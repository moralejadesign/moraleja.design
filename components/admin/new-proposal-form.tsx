"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { BudgetLanguage, Proposal } from "@/db/schema";

type NewProposalInput = { clientName: string; title: string; language: BudgetLanguage };

async function createProposal(data: NewProposalInput): Promise<Proposal> {
  const res = await fetch("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create proposal");
  return res.json();
}

const inputClass =
  "w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20";

export function NewProposalForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<NewProposalInput>({ clientName: "", title: "", language: "es" });

  const createMutation = useMutation({
    mutationFn: createProposal,
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      router.push(`/admin/proposals/${proposal.id}`);
    },
  });

  const update = <K extends keyof NewProposalInput>(field: K, value: NewProposalInput[K]) =>
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
        <Link href="/admin/proposals" className="p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Proposal</h1>
      </div>

      <div className="space-y-6 p-6 border border-border">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Client</label>
          <input
            type="text"
            value={formData.clientName}
            onChange={(e) => update("clientName", e.target.value)}
            placeholder="Nudo, Home Game, Indigho…"
            className={inputClass}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Title (optional)</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Brand redesign, Visual identity proposal…"
            className={inputClass}
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-muted-foreground mb-1.5">Language</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "es", label: "Español" },
                { value: "en", label: "English" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update("language", option.value)}
                className={`p-3 text-left border transition-colors ${
                  formData.language === option.value
                    ? "border-foreground bg-muted/50"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-destructive">Couldn&apos;t create the proposal. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={createMutation.isPending || !formData.clientName.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Create and upload slides
      </button>
    </form>
  );
}
