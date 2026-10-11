"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Check,
  Cloud,
  FileDown,
  Copy,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Library,
  RotateCcw,
} from "lucide-react";
import type { Budget, BudgetPhase, BudgetSection, BudgetStatus } from "@/db/schema";
import {
  BUDGET_STATUSES,
  DEFAULT_CONDITIONS,
  budgetFileName,
  budgetHeading,
  emptySection,
  formatMoney,
  newSectionId,
  sectionFromPhase,
  sumSectionPrices,
} from "@/lib/budgets";
import { BudgetDocument } from "./budget-document";
import { BudgetSharePanel } from "./budget-share-panel";
import { ScaledBudget, printBudgetDocument } from "@/components/budget-viewer";
import { STATUS_STYLES } from "./budgets-list";

type BudgetInput = Pick<
  Budget,
  | "clientName"
  | "title"
  | "kind"
  | "language"
  | "currency"
  | "status"
  | "issueDate"
  | "validDays"
  | "sections"
  | "total"
  | "showSectionPrices"
  | "advancePercent"
  | "showPaymentSchedule"
  | "conditions"
  | "internalNotes"
>;

type SaveStatus = "idle" | "saving" | "saved" | "error";

function toInput(budget: Budget): BudgetInput {
  return {
    clientName: budget.clientName,
    title: budget.title,
    kind: budget.kind,
    language: budget.language,
    currency: budget.currency,
    status: budget.status,
    issueDate: budget.issueDate,
    validDays: budget.validDays,
    sections: budget.sections,
    total: budget.total,
    showSectionPrices: budget.showSectionPrices,
    advancePercent: budget.advancePercent,
    showPaymentSchedule: budget.showPaymentSchedule,
    conditions: budget.conditions,
    internalNotes: budget.internalNotes,
  };
}

async function updateBudget({ id, data }: { id: number; data: BudgetInput }): Promise<Budget> {
  const res = await fetch(`/api/budgets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update budget");
  return res.json();
}

async function duplicateBudget(id: number): Promise<Budget> {
  const res = await fetch(`/api/budgets/${id}/duplicate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to duplicate budget");
  return res.json();
}

async function fetchPhases(): Promise<BudgetPhase[]> {
  const res = await fetch("/api/budget-phases");
  if (!res.ok) throw new Error("Failed to fetch phases");
  return res.json();
}

const inputClass =
  "w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20";
const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

function parsePrice(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value.replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? null : n;
}

export function BudgetEditor({ budget }: { budget: Budget }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BudgetInput>(() => toInput(budget));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [openSection, setOpenSection] = useState<string | null>(budget.sections[0]?.id ?? null);
  const [showLibrary, setShowLibrary] = useState(false);
  const lastSaved = useRef(JSON.stringify(toInput(budget)));
  const printRef = useRef<HTMLDivElement>(null);
  const hasChanges = JSON.stringify(formData) !== lastSaved.current;

  const { data: phases } = useQuery({ queryKey: ["budget-phases"], queryFn: fetchPhases });

  const updateMutation = useMutation({
    mutationFn: updateBudget,
    onMutate: () => setSaveStatus("saving"),
    onError: () => setSaveStatus("error"),
    onSuccess: (saved, { data }) => {
      lastSaved.current = JSON.stringify(data);
      queryClient.setQueryData(["budget", String(budget.id)], saved);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setSaveStatus("saved");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateBudget,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      router.push(`/admin/budgets/${created.id}`);
    },
  });

  // Autosave a second after the last change
  useEffect(() => {
    if (!hasChanges || updateMutation.isPending) return;
    const timeout = setTimeout(() => {
      updateMutation.mutate({ id: budget.id, data: formData });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData, hasChanges, budget.id, updateMutation.isPending]);

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

  const update = <K extends keyof BudgetInput>(field: K, value: BudgetInput[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Swap untouched default conditions when the type or language changes
  const changeKindOrLanguage = (changes: Pick<Partial<BudgetInput>, "kind" | "language">) =>
    setFormData((prev) => {
      const next = { ...prev, ...changes };
      const wasDefault =
        JSON.stringify(prev.conditions) === JSON.stringify(DEFAULT_CONDITIONS[prev.kind][prev.language]);
      return wasDefault ? { ...next, conditions: DEFAULT_CONDITIONS[next.kind][next.language] } : next;
    });

  const updateSection = (id: string, changes: Partial<BudgetSection>) =>
    update(
      "sections",
      formData.sections.map((s) => (s.id === id ? { ...s, ...changes } : s))
    );

  const moveSection = (index: number, direction: -1 | 1) => {
    const sections = [...formData.sections];
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    update("sections", sections);
  };

  const addSection = (section: BudgetSection) => {
    update("sections", [...formData.sections, section]);
    setOpenSection(section.id);
  };

  const sectionSum = sumSectionPrices(formData.sections);
  const perMonth = formData.kind === "retainer";

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/admin/budgets" className="p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {formData.clientName || "Untitled"}
            </h1>
            <p className="text-sm text-muted-foreground">{budget.code}</p>
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
            onChange={(e) => update("status", e.target.value as BudgetStatus)}
            className={`px-3 py-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-foreground/20 ${STATUS_STYLES[formData.status]}`}
            aria-label="Status"
          >
            {BUDGET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => duplicateMutation.mutate(budget.id)}
            disabled={duplicateMutation.isPending || hasChanges}
            title={hasChanges ? "Wait for changes to save" : "Duplicate as a new draft"}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => {
              printBudgetDocument(printRef.current, budgetFileName(formData));
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_auto] gap-8 items-start">
        {/* Form */}
        <div className="space-y-6 min-w-0 print:hidden">
          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Basics</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Client</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Heading</label>
                <input
                  type="text"
                  value={formData.title ?? ""}
                  onChange={(e) => update("title", e.target.value || null)}
                  placeholder={budgetHeading({ ...formData, title: null })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={formData.kind}
                  onChange={(e) => changeKindOrLanguage({ kind: e.target.value as BudgetInput["kind"] })}
                  className={inputClass}
                >
                  <option value="project">Project (numbered phases)</option>
                  <option value="retainer">Monthly fee</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      changeKindOrLanguage({ language: e.target.value as BudgetInput["language"] })
                    }
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
                    onChange={(e) => update("currency", e.target.value as BudgetInput["currency"])}
                    className={inputClass}
                  >
                    <option value="USD">USD</option>
                    <option value="COP">COP</option>
                  </select>
                </div>
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
              <div>
                <label className={labelClass}>Valid for (days)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.validDays}
                  onChange={(e) => update("validDays", Math.max(1, Number(e.target.value) || 30))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <BudgetSharePanel budget={budget} />

          {/* Sections */}
          <div className="space-y-4 p-6 border border-border">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">{perMonth ? "Sections" : "Phases"}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLibrary((v) => !v)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border transition-colors ${
                    showLibrary ? "border-foreground" : "border-border hover:bg-muted"
                  }`}
                >
                  <Library className="h-4 w-4" />
                  From library
                </button>
                <button
                  type="button"
                  onClick={() => addSection(emptySection())}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Blank
                </button>
              </div>
            </div>

            {showLibrary && (
              <div className="p-3 bg-muted/30 border border-border space-y-1">
                {!phases?.length ? (
                  <p className="text-sm text-muted-foreground p-2">
                    The library is empty.{" "}
                    <Link href="/admin/budgets/phases" className="underline hover:text-foreground">
                      Set it up
                    </Link>
                  </p>
                ) : (
                  phases.map((phase) => {
                    const content = phase.content[formData.language];
                    const price = phase.defaultPrice[formData.currency] ?? null;
                    return (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => addSection(sectionFromPhase(content, price))}
                        className="w-full flex items-center justify-between gap-4 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{phase.name}</span>
                        </span>
                        {price !== null && (
                          <span className="text-muted-foreground tabular-nums shrink-0">
                            {formatMoney(price, formData.currency)}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {formData.sections.length === 0 && !showLibrary && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Add phases from your library or start with a blank one.
              </p>
            )}

            <div className="space-y-2">
              {formData.sections.map((section, index) => {
                const isOpen = openSection === section.id;
                return (
                  <div key={section.id} className="border border-border">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setOpenSection(isOpen ? null : section.id)}
                        className="flex-1 flex items-center gap-2 min-w-0 text-left"
                      >
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                        />
                        {!perMonth && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {index + 1}
                          </span>
                        )}
                        <span className="truncate font-medium">
                          {section.title || <span className="text-muted-foreground">Untitled</span>}
                        </span>
                        {section.price !== null && (
                          <span className="ml-auto text-sm text-muted-foreground tabular-nums shrink-0">
                            {formatMoney(section.price, formData.currency)}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(index, 1)}
                          disabled={index === formData.sections.length - 1}
                          className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...section, bullets: [...section.bullets], id: newSectionId() };
                            const sections = [...formData.sections];
                            sections.splice(index + 1, 0, copy);
                            update("sections", sections);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              "sections",
                              formData.sections.filter((s) => s.id !== section.id)
                            )
                          }
                          className="p-1.5 text-muted-foreground hover:text-destructive"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-4 p-4 border-t border-border">
                        <div className="grid sm:grid-cols-[1fr_160px] gap-4">
                          <div>
                            <label className={labelClass}>Title</label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Price {perMonth && <span className="text-xs">/month</span>}
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={section.price ?? ""}
                              onChange={(e) =>
                                updateSection(section.id, { price: parsePrice(e.target.value) })
                              }
                              placeholder="Optional"
                              className={`${inputClass} tabular-nums`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Description</label>
                          <textarea
                            value={section.description}
                            onChange={(e) => updateSection(section.id, { description: e.target.value })}
                            rows={4}
                            className={`${inputClass} resize-y`}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Bullet points <span className="text-xs">(one per line)</span>
                          </label>
                          <textarea
                            value={section.bullets.join("\n")}
                            onChange={(e) =>
                              updateSection(section.id, { bullets: e.target.value.split("\n") })
                            }
                            rows={Math.max(2, section.bullets.length + 1)}
                            className={`${inputClass} resize-y`}
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className={labelClass}>Deliverable</label>
                            <input
                              type="text"
                              value={section.deliverable}
                              onChange={(e) => updateSection(section.id, { deliverable: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Includes</label>
                            <input
                              type="text"
                              value={section.includes}
                              onChange={(e) => updateSection(section.id, { includes: e.target.value })}
                              placeholder={formData.language === "es" ? "2 rondas de ajustes" : "2 rounds of revisions"}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Estimated duration</label>
                            <input
                              type="text"
                              value={section.duration}
                              onChange={(e) => updateSection(section.id, { duration: e.target.value })}
                              placeholder={formData.language === "es" ? "10 días" : "10 days"}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Write <code className="text-foreground">{"{client}"}</code> anywhere to insert the client&apos;s name.
            </p>
          </div>

          {/* Pricing */}
          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Investment</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Total {perMonth && <span className="text-xs">/month</span>}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.total === null ? "" : String(Number(formData.total))}
                  onChange={(e) => {
                    const price = parsePrice(e.target.value);
                    update("total", price === null ? null : String(price));
                  }}
                  placeholder={
                    sectionSum !== null
                      ? `Auto: ${formatMoney(sectionSum, formData.currency)}`
                      : "Amount"
                  }
                  className={`${inputClass} tabular-nums`}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {formData.total !== null && sectionSum !== null && Number(formData.total) !== sectionSum
                    ? `Overrides the phase sum (${formatMoney(sectionSum, formData.currency)})`
                    : "Leave empty to add up the phase prices"}
                </p>
              </div>
              <div>
                <label className={labelClass}>Advance (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.advancePercent}
                  onChange={(e) =>
                    update("advancePercent", Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showSectionPrices}
                onChange={(e) => update("showSectionPrices", e.target.checked)}
                className="w-4 h-4"
              />
              <span>
                <span className="font-medium">Show price per phase</span>
                <span className="block text-xs text-muted-foreground">
                  Lets the client see the breakdown and choose phases
                </span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showPaymentSchedule}
                onChange={(e) => update("showPaymentSchedule", e.target.checked)}
                className="w-4 h-4"
              />
              <span>
                <span className="font-medium">Show advance and balance</span>
                <span className="block text-xs text-muted-foreground">
                  Printed under the total
                </span>
              </span>
            </label>
          </div>

          {/* Conditions */}
          <div className="space-y-4 p-6 border border-border">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">General conditions</h2>
              <button
                type="button"
                onClick={() =>
                  update("conditions", DEFAULT_CONDITIONS[formData.kind][formData.language])
                }
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to defaults
              </button>
            </div>
            <div className="space-y-2">
              {formData.conditions.map((condition, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    value={condition}
                    onChange={(e) =>
                      update(
                        "conditions",
                        formData.conditions.map((c, j) => (j === i ? e.target.value : c))
                      )
                    }
                    rows={2}
                    className={`${inputClass} resize-y text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update("conditions", formData.conditions.filter((_, j) => j !== i))
                    }
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
              onClick={() => update("conditions", [...formData.conditions, ""])}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add condition
            </button>
            <p className="text-xs text-muted-foreground">
              <code className="text-foreground">{"{advance}"}</code> and{" "}
              <code className="text-foreground">{"{validDays}"}</code> are filled in from the
              settings above.
            </p>
          </div>

          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Internal notes</h2>
            <textarea
              value={formData.internalNotes ?? ""}
              onChange={(e) => update("internalNotes", e.target.value || null)}
              placeholder="Only you see this: hours estimate, who referred them, follow-up date…"
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        {/* Live preview; also what gets printed */}
        <div ref={printRef} className="xl:sticky xl:top-20 print:static">
          <ScaledBudget scale={0.6} className="border border-border print:border-0">
            <BudgetDocument budget={formData} />
          </ScaledBudget>
        </div>
      </div>
    </div>
  );
}
