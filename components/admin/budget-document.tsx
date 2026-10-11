/* eslint-disable @next/next/no-img-element -- static brand SVGs, printed as-is */
import type { Budget } from "@/db/schema";
import {
  BUDGET_CONTACT,
  BUDGET_LABELS,
  addDays,
  budgetHeading,
  budgetTotal,
  fillPlaceholders,
  formatBudgetDate,
  formatMoney,
} from "@/lib/budgets";

export type BudgetDocumentData = Pick<
  Budget,
  | "clientName"
  | "title"
  | "kind"
  | "language"
  | "currency"
  | "issueDate"
  | "validDays"
  | "sections"
  | "total"
  | "showSectionPrices"
  | "advancePercent"
  | "showPaymentSchedule"
  | "conditions"
>;

/** Letter-spaced line of characters, like the date under the title. */
function spaced(text: string) {
  return text.split("").join(" ");
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={
        muted
          ? "inline-block border border-white/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-snug text-white/40"
          : "inline bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase leading-[1.9] text-black [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
      }
    >
      {children}
    </span>
  );
}

export function BudgetDocument({ budget }: { budget: BudgetDocumentData }) {
  const t = BUDGET_LABELS[budget.language];
  const fill = (text: string) => fillPlaceholders(text, budget);
  const total = budgetTotal(budget);
  const numbered = budget.kind === "project";
  const perMonth = budget.kind === "retainer" ? t.perMonth : "";
  const advance = total !== null ? (total * budget.advancePercent) / 100 : null;
  const sections = budget.sections.filter(
    (s) => s.title || s.description || s.bullets.length > 0
  );
  const conditions = budget.conditions.filter((c) => c.trim());

  return (
    <article
      className="budget-document relative w-[800px] overflow-hidden bg-[#0a0a0a] font-sans text-white"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {/* Header */}
      <img
        src="/budgets/wave-header.svg"
        alt=""
        className="pointer-events-none absolute -left-[40px] -top-[60px] w-[900px] max-w-none"
      />
      <div className="relative flex items-start justify-between px-[72px] pt-[44px]">
        <span className="relative -ml-2 mt-1 bg-[#0a0a0a] px-2 py-1 text-[10px] font-bold tracking-[0.35em]">{BUDGET_CONTACT.site}</span>
        <img src="/budgets/studio-logo.svg" alt="Moraleja Studio" className="relative w-[96px]" />
      </div>

      <header className="relative mt-[56px] text-center">
        <h1 className="text-[22px] font-bold uppercase tracking-[0.5em]">{budgetHeading(budget)}</h1>
        <p className="mt-3 text-[10px] tracking-[0.5em] text-white/40">
          {spaced(formatBudgetDate(budget.issueDate))}
        </p>
      </header>

      {/* Sections */}
      <div className="relative mt-[48px] space-y-[40px] px-[72px]">
        {sections.map((section, i) => (
          <section key={section.id} className="relative flex gap-4 break-inside-avoid">
            <div className="relative w-4 shrink-0">
              {numbered && (
                <span className="absolute -left-[2px] top-[14px] origin-top-left translate-y-[52px] -rotate-90 whitespace-nowrap text-[8px] tracking-[0.35em] text-white/30">
                  {t.phase} {i + 1}
                </span>
              )}
              <span className="absolute left-[10px] top-[16px] bottom-0 w-px bg-white/30" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="flex items-baseline gap-3 text-[13px] font-medium uppercase tracking-[0.3em]">
                <span className="-ml-[17px] text-[11px]">+</span>
                <span className="flex-1">{fill(section.title)}</span>
                {budget.showSectionPrices && section.price !== null && (
                  <span className="shrink-0 text-[11px] tracking-[0.15em] text-white/70">
                    {formatMoney(section.price, budget.currency)}
                    {perMonth}
                  </span>
                )}
              </h2>

              {section.description && (
                <p className="mt-3 whitespace-pre-line text-justify text-[10.5px] leading-[1.6] text-white/55">
                  {fill(section.description)}
                </p>
              )}

              {section.bullets.filter(Boolean).length > 0 && (
                <ul className="mt-4 space-y-2.5 pl-6">
                  {section.bullets.filter(Boolean).map((bullet, j) => (
                    <li key={j} className="flex gap-2 text-[9.5px] font-semibold uppercase leading-[1.5]">
                      <span>+</span>
                      <span>{fill(bullet)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(section.deliverable || section.includes || section.duration) && (
                <div className="mt-4 space-y-2">
                  {section.deliverable && (
                    <p>
                      <Chip>
                        {t.deliverable}: {fill(section.deliverable)}
                      </Chip>
                    </p>
                  )}
                  {section.includes && (
                    <p>
                      <Chip>
                        {t.includes}: {fill(section.includes)}
                      </Chip>
                    </p>
                  )}
                  {section.duration && (
                    <p>
                      <Chip muted>
                        {t.duration}: {fill(section.duration)}
                      </Chip>
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Investment */}
      {total !== null && (
        <div className="relative mt-[56px] flex flex-col items-center break-inside-avoid">
          <p className="bg-white px-5 py-2 text-[24px] font-medium uppercase tracking-[0.18em] text-black">
            {t.investment}: {formatMoney(total, budget.currency)}
            {perMonth}
          </p>
          {budget.showPaymentSchedule && advance !== null && budget.advancePercent > 0 && (
            <p className="mt-4 text-[9.5px] uppercase tracking-[0.25em] text-white/50">
              {t.advance} {budget.advancePercent}%: {formatMoney(advance, budget.currency)}
              <span className="mx-3 text-white/25">·</span>
              {t.balance}: {formatMoney(total - advance, budget.currency)}
            </p>
          )}
        </div>
      )}

      <div className="mt-[40px] flex justify-center">
        <img src="/budgets/studio-mark.svg" alt="" className="h-[22px]" />
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div className="relative mx-[72px] mt-[28px] border-t border-white/20 pt-[36px] break-inside-avoid">
          <h2 className="text-center text-[12px] font-medium tracking-[0.35em]">{t.conditions}</h2>
          <ul className="mt-6 space-y-3">
            {conditions.map((condition, i) => (
              <li key={i} className="flex gap-2 text-justify text-[8px] leading-[1.6] text-white/50">
                <span>+</span>
                <span>{fill(condition)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-[8px] tracking-[0.3em] text-white/35">
            {t.validUntil} {formatBudgetDate(addDays(budget.issueDate, budget.validDays))}
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="relative mt-[56px] flex items-center justify-center gap-6 pb-[110px]">
        <img src="/budgets/studio-logo.svg" alt="" className="w-[60px]" />
        <div>
          <p className="text-[14px] font-medium tracking-[0.2em]">
            {BUDGET_CONTACT.email} · {BUDGET_CONTACT.phone}
          </p>
          <p className="mt-2 text-[7.5px] tracking-[0.75em] text-white/60">{BUDGET_CONTACT.tagline}</p>
        </div>
      </footer>
      <img
        src="/budgets/wave-corner.svg"
        alt=""
        className="pointer-events-none absolute -bottom-[20px] -right-[20px] w-[200px] max-w-none -scale-y-100"
      />
    </article>
  );
}
