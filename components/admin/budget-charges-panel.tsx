"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import type { Budget } from "@/db/schema";
import type { ChargePreset } from "@/lib/charges";
import { ChargeRow, createCharge, fetchCharges, sumByCurrency } from "./charges-list";

/** Cuentas de cobro made from this budget, and shortcuts to make the next one. */
export function BudgetChargesPanel({
  budget,
  disabled,
}: {
  budget: Pick<Budget, "id" | "kind" | "advancePercent">;
  // The new charge copies the saved budget, so wait for pending edits
  disabled: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: charges } = useQuery({
    queryKey: ["charges", budget.id],
    queryFn: () => fetchCharges(budget.id),
  });

  const createMutation = useMutation({
    mutationFn: (preset: ChargePreset) => createCharge({ budgetId: budget.id, preset }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      router.push(`/admin/budgets/charges/${created.id}`);
    },
  });

  const presets: { preset: ChargePreset; label: string }[] =
    budget.kind === "retainer"
      ? [{ preset: "month", label: "This month" }]
      : [
          ...(budget.advancePercent > 0 && budget.advancePercent < 100
            ? [
                { preset: "advance" as const, label: `Advance ${budget.advancePercent}%` },
                { preset: "balance" as const, label: `Balance ${100 - budget.advancePercent}%` },
              ]
            : []),
          { preset: "total", label: "Full amount" },
        ];

  const paid = charges?.filter((c) => c.status === "paid") ?? [];

  return (
    <div className="space-y-4 p-6 border border-border">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Cuentas de cobro</h2>
          {paid.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">Paid so far: {sumByCurrency(paid)}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {presets.map(({ preset, label }) => (
            <button
              key={preset}
              type="button"
              onClick={() => createMutation.mutate(preset)}
              disabled={disabled || createMutation.isPending}
              title={disabled ? "Wait for changes to save" : undefined}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {charges && charges.length > 0 ? (
        <div className="space-y-2">
          {charges.map((charge) => (
            <ChargeRow key={charge.id} item={charge} showClient={false} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          None yet. Each one gets its own consecutive number and PDF.
        </p>
      )}
    </div>
  );
}
