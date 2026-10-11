"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { BudgetEditor } from "@/components/admin/budget-editor";
import type { Budget } from "@/db/schema";

async function fetchBudget(id: string): Promise<Budget> {
  const res = await fetch(`/api/budgets/${id}`);
  if (!res.ok) throw new Error("Failed to fetch budget");
  return res.json();
}

export default function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: budget, isLoading, error } = useQuery({
    queryKey: ["budget", id],
    queryFn: () => fetchBudget(id),
    // The editor keeps its own state and writes saves back into this cache
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Budget not found</p>
      </div>
    );
  }

  return <BudgetEditor key={budget.id} budget={budget} />;
}
