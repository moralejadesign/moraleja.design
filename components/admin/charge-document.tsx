/* eslint-disable @next/next/no-img-element -- static brand SVGs, printed as-is */
import type { BillingProfile, ChargeAccount } from "@/db/schema";
import { BUDGET_CONTACT, formatMoney } from "@/lib/budgets";
import { CHARGE_LABELS, amountInWords, chargeTotal, formatLongDate } from "@/lib/charges";
import { DocumentFooter } from "./budget-document";

export type ChargeDocumentData = Pick<
  ChargeAccount,
  | "code"
  | "clientName"
  | "clientTaxId"
  | "language"
  | "currency"
  | "issueDate"
  | "city"
  | "items"
  | "paymentDetails"
  | "notes"
>;

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[8.5px] tracking-[0.4em] text-white/40">{children}</p>;
}

export function ChargeDocument({
  charge,
  profile,
}: {
  charge: ChargeDocumentData;
  profile: Pick<BillingProfile, "fullName" | "idNumber">;
}) {
  const t = CHARGE_LABELS[charge.language];
  const total = chargeTotal(charge);
  const items = charge.items.filter((item) => item.description.trim() || item.amount !== null);
  const notes = charge.notes.filter((n) => n.trim());
  const place = [charge.city, formatLongDate(charge.issueDate, charge.language)].filter(Boolean).join(", ");

  return (
    // Same class as the budget so printBudgetDocument and the print CSS pick it up
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
        <h1 className="text-[22px] font-bold uppercase tracking-[0.5em]">{t.title}</h1>
        <p className="mt-3 text-[10px] tracking-[0.4em] text-white/60">
          {t.number} {charge.code}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/40">{place}</p>
      </header>

      {/* Parties */}
      <div className="relative mx-[72px] mt-[48px] grid grid-cols-2 gap-10 border-y border-white/20 py-[28px]">
        <div>
          <p className="text-[14px] font-medium uppercase tracking-[0.2em]">{charge.clientName || "…"}</p>
          {charge.clientTaxId && (
            <p className="mt-2 text-[10px] tracking-[0.2em] text-white/55">
              {t.taxId} {charge.clientTaxId}
            </p>
          )}
        </div>
        <div>
          <Label>{t.owesTo}</Label>
          <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.2em]">{profile.fullName || "…"}</p>
          {profile.idNumber && (
            <p className="mt-2 text-[10px] tracking-[0.2em] text-white/55">
              {t.idNumber} {profile.idNumber}
            </p>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="relative mt-[44px] flex flex-col items-center px-[72px] text-center">
        <Label>{t.theSumOf}</Label>
        <p className="mt-4 bg-white px-5 py-2 text-[24px] font-medium uppercase tracking-[0.18em] text-black">
          {formatMoney(total, charge.currency)}
        </p>
        <p className="mt-4 max-w-[560px] text-[9.5px] font-semibold uppercase leading-[1.6] tracking-[0.2em] text-white/60">
          {amountInWords(total, charge.currency, charge.language)}
        </p>
      </div>

      {/* Concept */}
      <div className="relative mx-[72px] mt-[48px] break-inside-avoid">
        <Label>{t.concept}</Label>
        <ul className="mt-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline gap-6 border-b border-white/15 py-3 text-[10.5px] leading-[1.6]"
            >
              <span className="flex flex-1 gap-2 whitespace-pre-line text-white/75">
                <span className="text-white">+</span>
                <span>{item.description}</span>
              </span>
              {item.amount !== null && (
                <span className="shrink-0 tabular-nums tracking-[0.1em]">
                  {formatMoney(item.amount, charge.currency)}
                </span>
              )}
            </li>
          ))}
        </ul>
        {items.length > 1 && (
          <p className="mt-3 flex justify-end gap-6 text-[11px] font-medium tracking-[0.2em]">
            <span className="text-white/50">{t.total}</span>
            <span className="tabular-nums">{formatMoney(total, charge.currency)}</span>
          </p>
        )}
      </div>

      {/* Payment details */}
      {charge.paymentDetails?.trim() && (
        <div className="relative mx-[72px] mt-[40px] break-inside-avoid">
          <Label>{t.payment}</Label>
          <p className="mt-3 whitespace-pre-line text-[10.5px] leading-[1.7] text-white/75">
            {charge.paymentDetails}
          </p>
        </div>
      )}

      <div className="mt-[48px] flex justify-center">
        <img src="/budgets/studio-mark.svg" alt="" className="h-[22px]" />
      </div>

      {/* Declarations */}
      {notes.length > 0 && (
        <ul className="relative mx-[72px] mt-[28px] space-y-2 border-t border-white/20 pt-[28px] break-inside-avoid">
          {notes.map((note, i) => (
            <li key={i} className="flex gap-2 text-justify text-[8px] leading-[1.6] text-white/50">
              <span>+</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}

      <DocumentFooter />
    </article>
  );
}
