import type {
  Budget,
  BudgetCurrency,
  BudgetLanguage,
  ChargeAccount,
  ChargeItem,
  ChargeStatus,
} from "@/db/schema";
import { budgetTotal, newSectionId } from "@/lib/budgets";

export const CHARGE_STATUSES: { value: ChargeStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
];

/** Words printed on the document, per language. */
export const CHARGE_LABELS: Record<
  BudgetLanguage,
  {
    title: string;
    number: string;
    taxId: string;
    owesTo: string;
    idNumber: string;
    theSumOf: string;
    concept: string;
    total: string;
    payment: string;
  }
> = {
  es: {
    title: "CUENTA DE COBRO",
    number: "N.º",
    taxId: "NIT / C.C.",
    owesTo: "DEBE A",
    idNumber: "C.C.",
    theSumOf: "LA SUMA DE",
    concept: "POR CONCEPTO DE",
    total: "TOTAL",
    payment: "DATOS PARA EL PAGO",
  },
  en: {
    title: "INVOICE",
    number: "NO.",
    taxId: "TAX ID",
    owesTo: "PAYABLE TO",
    idNumber: "ID (C.C.)",
    theSumOf: "AMOUNT DUE",
    concept: "FOR",
    total: "TOTAL",
    payment: "PAYMENT DETAILS",
  },
};

/** Declarations for a person not responsible for IVA; editable on each document. */
export const DEFAULT_CHARGE_NOTES: Record<BudgetLanguage, string[]> = {
  es: [
    "Declaro que soy persona natural no responsable del impuesto sobre las ventas (IVA) y no estoy en la obligación de expedir factura electrónica de venta.",
    "Para efectos de la retención en la fuente, declaro que no he contratado ni vinculado dos o más trabajadores asociados a la actividad.",
  ],
  en: [
    "Services rendered by an individual in Colombia who is not registered for VAT (IVA); no VAT is charged.",
  ],
};

export function emptyChargeItem(description = "", amount: number | null = null): ChargeItem {
  return { id: newSectionId(), description, amount };
}

export function chargeTotal(charge: Pick<ChargeAccount, "items">): number {
  return charge.items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
}

/** "2026-10-26" -> "26 de octubre de 2026" / "October 26, 2026" */
export function formatLongDate(isoDate: string, language: BudgetLanguage) {
  return new Intl.DateTimeFormat(language === "es" ? "es-CO" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** Used as the PDF filename: moraleja_nudo_cuenta_de_cobro_CC-2026-001 */
export function chargeFileName(charge: Pick<ChargeAccount, "clientName" | "code" | "language">) {
  const slug = charge.clientName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const kind = charge.language === "es" ? "cuenta_de_cobro" : "invoice";
  return `moraleja_${slug || "client"}_${kind}_${charge.code}`;
}

export type ChargePreset = "advance" | "balance" | "total" | "month";

/** Items a new cuenta de cobro starts with when made from a budget. */
export function presetItems(
  budget: Pick<Budget, "code" | "title" | "language" | "total" | "sections" | "advancePercent" | "kind">,
  preset: ChargePreset,
  today: string
): ChargeItem[] {
  const total = budgetTotal(budget);
  // The custom heading if there is one, else the budget number: "Budget MOR-2026-014"
  const heading = budget.title?.trim() || `Budget ${budget.code}`;
  const es = budget.language === "es";
  const pct = budget.advancePercent;
  const round = (n: number) => Math.round(n * 100) / 100;

  switch (preset) {
    case "advance":
      return [
        emptyChargeItem(
          es ? `Anticipo del ${pct}% · ${heading}` : `${pct}% advance · ${heading}`,
          total === null ? null : round((total * pct) / 100)
        ),
      ];
    case "balance":
      return [
        emptyChargeItem(
          es ? `Saldo del ${100 - pct}% · ${heading}` : `${100 - pct}% balance · ${heading}`,
          total === null ? null : round((total * (100 - pct)) / 100)
        ),
      ];
    case "month": {
      const month = new Intl.DateTimeFormat(es ? "es-CO" : "en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${today}T00:00:00Z`));
      return [emptyChargeItem(es ? `Fee mensual · ${month} · ${heading}` : `Monthly fee · ${month} · ${heading}`, total)];
    }
    case "total":
      return [emptyChargeItem(heading, total)];
  }
}

// Amount in words

const ES_UNITS = [
  "", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
  "VEINTE", "VEINTIÚN", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
];
const ES_TENS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const ES_HUNDREDS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];

/** 0–999, with the apocopated "UN" / "VEINTIÚN" used before a noun. */
function esHundreds(n: number): string {
  if (n === 100) return "CIEN";
  const parts: string[] = [];
  if (n >= 100) parts.push(ES_HUNDREDS[Math.floor(n / 100)]);
  const rest = n % 100;
  if (rest > 0 && rest < 30) parts.push(ES_UNITS[rest]);
  else if (rest >= 30) {
    const unit = rest % 10;
    parts.push(unit ? `${ES_TENS[Math.floor(rest / 10)]} Y ${ES_UNITS[unit]}` : ES_TENS[Math.floor(rest / 10)]);
  }
  return parts.join(" ");
}

function esInteger(n: number): string {
  if (n === 0) return "CERO";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions > 0) parts.push(millions === 1 ? "UN MILLÓN" : `${esInteger(millions)} MILLONES`);
  if (thousands > 0) parts.push(thousands === 1 ? "MIL" : `${esHundreds(thousands)} MIL`);
  if (rest > 0) parts.push(esHundreds(rest));
  return parts.join(" ");
}

const EN_ONES = [
  "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN",
];
const EN_TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function enHundreds(n: number): string {
  const parts: string[] = [];
  if (n >= 100) parts.push(`${EN_ONES[Math.floor(n / 100)]} HUNDRED`);
  const rest = n % 100;
  if (rest > 0 && rest < 20) parts.push(EN_ONES[rest]);
  else if (rest >= 20) parts.push(rest % 10 ? `${EN_TENS[Math.floor(rest / 10)]}-${EN_ONES[rest % 10]}` : EN_TENS[Math.floor(rest / 10)]);
  return parts.join(" ");
}

function enInteger(n: number): string {
  if (n === 0) return "ZERO";
  const scales: [number, string][] = [[1_000_000_000, "BILLION"], [1_000_000, "MILLION"], [1000, "THOUSAND"]];
  const parts: string[] = [];
  let rest = n;
  for (const [size, name] of scales) {
    if (rest >= size) {
      parts.push(`${enHundreds(Math.floor(rest / size))} ${name}`);
      rest %= size;
    }
  }
  if (rest > 0) parts.push(enHundreds(rest));
  return parts.join(" ");
}

/**
 * "CINCO MILLONES DE PESOS M/CTE", "MIL QUINIENTOS DÓLARES ESTADOUNIDENSES CON 50/100",
 * "ONE THOUSAND FIVE HUNDRED US DOLLARS AND 50/100".
 */
export function amountInWords(amount: number, currency: BudgetCurrency, language: BudgetLanguage) {
  const whole = Math.floor(Math.round(amount * 100) / 100);
  const cents = Math.round((amount - whole) * 100);
  const centsText = cents > 0 ? String(cents).padStart(2, "0") + "/100" : "";

  if (language === "en") {
    const unit = (currency === "COP" ? "COLOMBIAN PESO" : "US DOLLAR") + (whole === 1 ? "" : "S");
    return [enInteger(whole), unit, centsText && `AND ${centsText}`].filter(Boolean).join(" ");
  }

  // "UN MILLÓN DE PESOS" but "UN MILLÓN QUINIENTOS MIL PESOS"
  const of = whole >= 1_000_000 && whole % 1_000_000 === 0 ? " DE" : "";
  const singular = whole === 1;
  const unit =
    currency === "COP"
      ? `${singular ? "PESO" : "PESOS"} M/CTE`
      : singular ? "DÓLAR ESTADOUNIDENSE" : "DÓLARES ESTADOUNIDENSES";
  return [`${esInteger(whole)}${of}`, unit, centsText && `CON ${centsText}`].filter(Boolean).join(" ");
}
