"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, Cloud, FileDown, Plus, Trash2, RotateCcw, UserRound } from "lucide-react";
import type { BillingProfile, ChargeAccount, ChargeItem, ChargeStatus } from "@/db/schema";
import { formatMoney, todayIso } from "@/lib/budgets";
import { CHARGE_STATUSES, DEFAULT_CHARGE_NOTES, chargeFileName, chargeTotal, emptyChargeItem } from "@/lib/charges";
import { ChargeDocument } from "./charge-document";
import { ScaledBudget, printBudgetDocument } from "@/components/budget-viewer";
import { CHARGE_STATUS_STYLES } from "./charges-list";

type ChargeInput = Pick<
  ChargeAccount,
  | "clientName"
  | "clientTaxId"
  | "language"
  | "currency"
  | "status"
  | "issueDate"
  | "city"
  | "items"
  | "paymentDetails"
  | "notes"
  | "paidAt"
  | "internalNotes"
>;

type SaveStatus = "idle" | "saving" | "saved" | "error";

function toInput(charge: ChargeAccount): ChargeInput {
  return {
    clientName: charge.clientName,
    clientTaxId: charge.clientTaxId,
    language: charge.language,
    currency: charge.currency,
    status: charge.status,
    issueDate: charge.issueDate,
    city: charge.city,
    items: charge.items,
    paymentDetails: charge.paymentDetails,
    notes: charge.notes,
    paidAt: charge.paidAt,
    internalNotes: charge.internalNotes,
  };
}

async function updateCharge({ id, data }: { id: number; data: ChargeInput }): Promise<ChargeAccount> {
  const res = await fetch(`/api/charges/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update charge account");
  return res.json();
}

export async function fetchBillingProfile(): Promise<BillingProfile> {
  const res = await fetch("/api/billing-profile");
  if (!res.ok) throw new Error("Failed to fetch billing profile");
  return res.json();
}

const inputClass =
  "w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20";
const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

function parseAmount(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value.replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? null : n;
}

export function ChargeEditor({ charge }: { charge: ChargeAccount }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ChargeInput>(() => toInput(charge));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSaved = useRef(JSON.stringify(toInput(charge)));
  const printRef = useRef<HTMLDivElement>(null);
  const hasChanges = JSON.stringify(formData) !== lastSaved.current;

  const { data: profile } = useQuery({ queryKey: ["billing-profile"], queryFn: fetchBillingProfile });
  const profileMissing = profile && (!profile.fullName || !profile.idNumber);

  const updateMutation = useMutation({
    mutationFn: updateCharge,
    onMutate: () => setSaveStatus("saving"),
    onError: () => setSaveStatus("error"),
    onSuccess: (saved, { data }) => {
      lastSaved.current = JSON.stringify(data);
      queryClient.setQueryData(["charge", String(charge.id)], saved);
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      setSaveStatus("saved");
    },
  });

  // Autosave a second after the last change
  useEffect(() => {
    if (!hasChanges || updateMutation.isPending) return;
    const timeout = setTimeout(() => {
      updateMutation.mutate({ id: charge.id, data: formData });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData, hasChanges, charge.id, updateMutation.isPending]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timeout = setTimeout(() => setSaveStatus("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [saveStatus]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const update = <K extends keyof ChargeInput>(field: K, value: ChargeInput[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Marking it paid fills in today's date; going back clears it
  const changeStatus = (status: ChargeStatus) =>
    setFormData((prev) => ({
      ...prev,
      status,
      paidAt: status === "paid" ? prev.paidAt ?? todayIso() : null,
    }));

  // Swap untouched default notes when the language changes
  const changeLanguage = (language: ChargeInput["language"]) =>
    setFormData((prev) => {
      const wasDefault = JSON.stringify(prev.notes) === JSON.stringify(DEFAULT_CHARGE_NOTES[prev.language]);
      return { ...prev, language, notes: wasDefault ? DEFAULT_CHARGE_NOTES[language] : prev.notes };
    });

  const updateItem = (id: string, changes: Partial<ChargeItem>) =>
    update(
      "items",
      formData.items.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href={charge.budgetId ? `/admin/budgets/${charge.budgetId}` : "/admin/budgets/charges"}
            className="p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{formData.clientName || "Untitled"}</h1>
            <p className="text-sm text-muted-foreground">
              Cuenta de cobro {charge.code}
              {charge.budgetId && (
                <>
                  {" · "}
                  <Link href={`/admin/budgets/${charge.budgetId}`} className="underline hover:text-foreground">
                    From budget
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === "error" && <span className="text-destructive">Save failed</span>}
            {saveStatus === "idle" && hasChanges && (
              <>
                <Cloud className="h-3.5 w-3.5" />
                <span>Unsaved</span>
              </>
            )}
          </div>
          <select
            value={formData.status}
            onChange={(e) => changeStatus(e.target.value as ChargeStatus)}
            className={`px-3 py-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-foreground/20 ${CHARGE_STATUS_STYLES[formData.status]}`}
            aria-label="Status"
          >
            {CHARGE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => printBudgetDocument(printRef.current, chargeFileName({ ...formData, code: charge.code }))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {profileMissing && (
        <div className="flex items-center justify-between gap-4 p-4 border border-amber-500/40 bg-amber-500/5 text-sm print:hidden">
          <span>Your name and ID number are missing from the document.</span>
          <Link href="/admin/budgets/charges/profile" className="underline hover:text-foreground">
            Add billing details
          </Link>
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_auto] gap-8 items-start">
        {/* Form */}
        <div className="space-y-6 min-w-0 print:hidden">
          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Client</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>NIT / C.C. / Tax ID</label>
                <input
                  type="text"
                  value={formData.clientTaxId ?? ""}
                  onChange={(e) => update("clientTaxId", e.target.value || null)}
                  placeholder="900.123.456-7"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Document</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => changeLanguage(e.target.value as ChargeInput["language"])}
                    className={inputClass}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => update("currency", e.target.value as ChargeInput["currency"])}
                    className={inputClass}
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={formData.city ?? ""}
                    onChange={(e) => update("city", e.target.value || null)}
                    placeholder="Bogotá"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => e.target.value && update("issueDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              {formData.status === "paid" && (
                <div>
                  <label className={labelClass}>Paid on</label>
                  <input
                    type="date"
                    value={formData.paidAt ?? ""}
                    onChange={(e) => update("paidAt", e.target.value || null)}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4 p-6 border border-border">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">Concept</h2>
              <span className="text-sm tabular-nums">
                Total: <span className="font-medium">{formatMoney(chargeTotal(formData), formData.currency)}</span>
              </span>
            </div>
            <div className="space-y-2">
              {formData.items.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder={formData.language === "es" ? "Anticipo del 50% · Identidad visual" : "50% advance · Visual identity"}
                    rows={2}
                    className={`${inputClass} resize-y text-sm`}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.amount ?? ""}
                    onChange={(e) => updateItem(item.id, { amount: parseAmount(e.target.value) })}
                    placeholder="Amount"
                    className={`${inputClass} w-40 self-start tabular-nums`}
                  />
                  <button
                    type="button"
                    onClick={() => update("items", formData.items.filter((i) => i.id !== item.id))}
                    className="p-2 self-start text-muted-foreground hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => update("items", [...formData.items, emptyChargeItem()])}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add line
            </button>
          </div>

          <div className="space-y-4 p-6 border border-border">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">Payment details</h2>
              {profile?.paymentDetails && formData.paymentDetails !== profile.paymentDetails && (
                <button
                  type="button"
                  onClick={() => update("paymentDetails", profile.paymentDetails)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Use saved details
                </button>
              )}
            </div>
            <textarea
              value={formData.paymentDetails ?? ""}
              onChange={(e) => update("paymentDetails", e.target.value || null)}
              placeholder={"Bancolombia · Cuenta de ahorros\nN.º 000-000000-00"}
              rows={3}
              className={`${inputClass} resize-y text-sm`}
            />
          </div>

          {/* Notes */}
          <div className="space-y-4 p-6 border border-border">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">Declarations</h2>
              <button
                type="button"
                onClick={() => update("notes", DEFAULT_CHARGE_NOTES[formData.language])}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to defaults
              </button>
            </div>
            <div className="space-y-2">
              {formData.notes.map((note, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    value={note}
                    onChange={(e) =>
                      update(
                        "notes",
                        formData.notes.map((n, j) => (j === i ? e.target.value : n))
                      )
                    }
                    rows={2}
                    className={`${inputClass} resize-y text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => update("notes", formData.notes.filter((_, j) => j !== i))}
                    className="p-2 self-start text-muted-foreground hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => update("notes", [...formData.notes, ""])}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add note
            </button>
          </div>

          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Internal notes</h2>
            <textarea
              value={formData.internalNotes ?? ""}
              onChange={(e) => update("internalNotes", e.target.value || null)}
              placeholder="Only you see this: who to send it to, payment reference…"
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </div>

          <Link
            href="/admin/budgets/charges/profile"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <UserRound className="h-4 w-4" />
            Edit your billing details
          </Link>
        </div>

        {/* Live preview; also what gets printed */}
        <div ref={printRef} className="xl:sticky xl:top-20 print:static">
          <ScaledBudget scale={0.6} className="border border-border print:border-0">
            <ChargeDocument
              charge={{ ...formData, code: charge.code }}
              profile={profile ?? { fullName: "", idNumber: "" }}
            />
          </ScaledBudget>
        </div>
      </div>
    </div>
  );
}
