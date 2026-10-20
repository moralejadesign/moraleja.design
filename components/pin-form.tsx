"use client";

/* eslint-disable @next/next/no-img-element -- static brand SVG */
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { BudgetLanguage } from "@/db/schema";
import { PIN_LOCK_MINUTES } from "@/lib/budget-share-config";
import type { PinState } from "@/lib/budget-share-config";

const COPY = {
  es: {
    prompt: { budget: "Ingresa el PIN para ver la propuesta", briefing: "Ingresa el PIN para abrir el briefing" },
    submit: { budget: "Ver propuesta", briefing: "Abrir" },
    wrong: (left: number) => `PIN incorrecto. ${left === 1 ? "Te queda 1 intento" : `Te quedan ${left} intentos`}.`,
    locked: `Demasiados intentos. Intenta de nuevo en ${PIN_LOCK_MINUTES} minutos.`,
  },
  en: {
    prompt: { budget: "Enter the PIN to view the proposal", briefing: "Enter the PIN to open the briefing" },
    submit: { budget: "View proposal", briefing: "Open" },
    wrong: (left: number) => `Wrong PIN. ${left === 1 ? "1 attempt" : `${left} attempts`} left.`,
    locked: `Too many attempts. Try again in ${PIN_LOCK_MINUTES} minutes.`,
  },
} satisfies Record<BudgetLanguage, unknown>;

/** PIN screen for private client links; `verify` is a server action bound to the link token. */
export function PinForm({
  verify,
  language,
  kind = "budget",
}: {
  verify: (prev: PinState, formData: FormData) => Promise<PinState>;
  language: BudgetLanguage;
  kind?: "budget" | "briefing";
}) {
  const [state, action, isPending] = useActionState<PinState, FormData>(verify, null);
  const t = COPY[language];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form action={action} className="w-full max-w-xs flex flex-col items-center text-center">
        <img src="/budgets/studio-logo.svg" alt="Moraleja Studio" className="w-[88px]" />
        <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-white/60">{t.prompt[kind]}</p>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoFocus
          aria-label="PIN"
          className="mt-6 w-full bg-transparent border border-white/25 px-4 py-3 text-center text-2xl tracking-[0.6em] tabular-nums focus:outline-none focus:border-white"
        />
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-white px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.3em] text-black hover:bg-white/90 transition-colors disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t.submit[kind]}
        </button>
        <p className="mt-4 min-h-[1.5em] text-[11px] text-red-400" role="alert">
          {state?.error === "wrong" && t.wrong(state.attemptsLeft)}
          {state?.error === "locked" && t.locked}
        </p>
      </form>
    </div>
  );
}
