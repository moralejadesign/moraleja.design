"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import type { Budget, BudgetStatus } from "@/db/schema";
import { BUDGET_STATUSES, budgetTotal, formatBudgetDate, formatMoney } from "@/lib/budgets";

async function fetchBudgets(): Promise<Budget[]> {
  const res = await fetch("/api/budgets");
  if (!res.ok) throw new Error("Failed to fetch budgets");
  return res.json();
}

async function deleteBudget(id: number): Promise<void> {
  const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete budget");
}

async function duplicateBudget(id: number): Promise<Budget> {
  const res = await fetch(`/api/budgets/${id}/duplicate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to duplicate budget");
  return res.json();
}

async function updateStatus(id: number, status: BudgetStatus): Promise<void> {
  const res = await fetch(`/api/budgets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update budget");
}

export const STATUS_STYLES: Record<BudgetStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

export function BudgetsList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<BudgetStatus | "all">("all");

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["budgets"],
    queryFn: fetchBudgets,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateBudget,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      router.push(`/admin/budgets/${created.id}`);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BudgetStatus }) => updateStatus(id, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load budgets. Please try again.
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No budgets yet</p>
        <Link
          href="/admin/budgets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create your first budget
        </Link>
      </div>
    );
  }

  const visible = filter === "all" ? items : items.filter((b) => b.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...BUDGET_STATUSES.map((s) => s.value)] as const).map((value) => {
          const count = value === "all" ? items.length : items.filter((b) => b.status === value).length;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1 text-sm border transition-colors capitalize ${
                filter === value
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {value} <span className="text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {visible.map((item) => {
          const total = budgetTotal(item);
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-colors"
            >
              <Link href={`/admin/budgets/${item.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{item.clientName}</h3>
                  <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs">
                    {item.kind === "retainer" ? "Monthly fee" : "Project"}
                  </span>
                  <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs uppercase">
                    {item.language}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.code} · {formatBudgetDate(item.issueDate)} · {item.sections.length}{" "}
                  {item.sections.length === 1 ? "section" : "sections"}
                </p>
              </Link>

              <div className="text-right shrink-0 tabular-nums">
                {total !== null ? (
                  <span className="font-medium">
                    {formatMoney(total, item.currency)}
                    {item.kind === "retainer" && <span className="text-muted-foreground">/mo</span>}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">No price</span>
                )}
              </div>

              <select
                value={item.status}
                onChange={(e) =>
                  statusMutation.mutate({ id: item.id, status: e.target.value as BudgetStatus })
                }
                className={`px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-foreground/20 ${STATUS_STYLES[item.status]}`}
                aria-label="Status"
              >
                {BUDGET_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/budgets/${item.id}`}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => duplicateMutation.mutate(item.id)}
                  disabled={duplicateMutation.isPending}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete the ${item.clientName} budget (${item.code})?`)) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
