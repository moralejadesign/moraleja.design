"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import type { BudgetCurrency, BudgetLanguage, ChargeAccount, ChargeStatus } from "@/db/schema";
import { formatBudgetDate, formatMoney, todayIso } from "@/lib/budgets";
import { CHARGE_STATUSES, chargeTotal } from "@/lib/charges";

export async function fetchCharges(budgetId?: number): Promise<ChargeAccount[]> {
  const res = await fetch(budgetId ? `/api/charges?budgetId=${budgetId}` : "/api/charges");
  if (!res.ok) throw new Error("Failed to fetch charge accounts");
  return res.json();
}

export async function createCharge(data: Record<string, unknown>): Promise<ChargeAccount> {
  const res = await fetch("/api/charges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create charge account");
  return res.json();
}

async function deleteCharge(id: number): Promise<void> {
  const res = await fetch(`/api/charges/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete charge account");
}

async function updateStatus(id: number, status: ChargeStatus, paidAt: string | null): Promise<void> {
  const res = await fetch(`/api/charges/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, paidAt }),
  });
  if (!res.ok) throw new Error("Failed to update charge account");
}

export const CHARGE_STATUS_STYLES: Record<ChargeStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-400",
  paid: "bg-green-500/10 text-green-400",
};

/** "COP 5.000.000 · USD 1,200" for amounts in mixed currencies. */
export function sumByCurrency(charges: ChargeAccount[]) {
  const sums = new Map<BudgetCurrency, number>();
  for (const c of charges) sums.set(c.currency, (sums.get(c.currency) ?? 0) + chargeTotal(c));
  return [...sums].map(([currency, amount]) => formatMoney(amount, currency)).join(" · ");
}

/** One row per cuenta de cobro; shared by the full list and the budget panel. */
export function ChargeRow({ item, showClient = true }: { item: ChargeAccount; showClient?: boolean }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteCharge,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["charges"] }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ChargeStatus) =>
      updateStatus(item.id, status, status === "paid" ? item.paidAt ?? todayIso() : null),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["charges"] }),
  });

  const firstLine = item.items.find((i) => i.description.trim())?.description;

  return (
    <div className="flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-colors">
      <Link href={`/admin/budgets/charges/${item.id}`} className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{showClient ? item.clientName : firstLine || item.code}</h3>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {item.code} · {formatBudgetDate(item.issueDate)}
          {showClient && firstLine && ` · ${firstLine}`}
          {item.paidAt && ` · Paid ${formatBudgetDate(item.paidAt)}`}
        </p>
      </Link>

      <span className="font-medium shrink-0 tabular-nums">{formatMoney(chargeTotal(item), item.currency)}</span>

      <select
        value={item.status}
        onChange={(e) => statusMutation.mutate(e.target.value as ChargeStatus)}
        className={`px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-foreground/20 ${CHARGE_STATUS_STYLES[item.status]}`}
        aria-label="Status"
      >
        {CHARGE_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <Link
          href={`/admin/budgets/charges/${item.id}`}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          onClick={() => {
            if (confirm(`Delete cuenta de cobro ${item.code} (${item.clientName})?`)) {
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
}

const inputClass =
  "px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20";

/** For charges that don't come from a budget. */
function NewChargeForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [clientName, setClientName] = useState("");
  const [currency, setCurrency] = useState<BudgetCurrency>("COP");
  const [language, setLanguage] = useState<BudgetLanguage>("es");

  const createMutation = useMutation({
    mutationFn: createCharge,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      router.push(`/admin/budgets/charges/${created.id}`);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate({ clientName, currency, language });
      }}
      className="flex flex-wrap items-center gap-2 p-4 border border-dashed border-border"
    >
      <input
        type="text"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        placeholder="Client"
        className={`${inputClass} flex-1 min-w-48`}
      />
      <select value={currency} onChange={(e) => setCurrency(e.target.value as BudgetCurrency)} className={inputClass}>
        <option value="COP">COP</option>
        <option value="USD">USD</option>
      </select>
      <select value={language} onChange={(e) => setLanguage(e.target.value as BudgetLanguage)} className={inputClass}>
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
      <button
        type="submit"
        disabled={createMutation.isPending || !clientName.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        New without budget
      </button>
    </form>
  );
}

export function ChargesList() {
  const [filter, setFilter] = useState<ChargeStatus | "all">("all");

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["charges"],
    queryFn: () => fetchCharges(),
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

  if (error || !items) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load cuentas de cobro. Please try again.
      </div>
    );
  }

  const visible = filter === "all" ? items : items.filter((c) => c.status === filter);
  const pending = items.filter((c) => c.status === "sent");

  return (
    <div className="space-y-4">
      <NewChargeForm />

      {items.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          No cuentas de cobro yet. Create one from a budget, or above for a one-off charge.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(["all", ...CHARGE_STATUSES.map((s) => s.value)] as const).map((value) => {
                const count = value === "all" ? items.length : items.filter((c) => c.status === value).length;
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
            {pending.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Awaiting payment: <span className="text-foreground tabular-nums">{sumByCurrency(pending)}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            {visible.map((item) => (
              <ChargeRow key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
