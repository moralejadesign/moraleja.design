"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import {
  ACCESS_DAYS,
  MAX_PIN_ATTEMPTS,
  PIN_LOCK_MINUTES,
  accessCookieName,
  pinMatches,
  signAccess,
} from "@/lib/budget-share";

export type PinState = { error: "wrong"; attemptsLeft: number } | { error: "locked" } | null;

export async function verifyPin(token: string, _prev: PinState, formData: FormData): Promise<PinState> {
  const pin = String(formData.get("pin") ?? "");

  const [budget] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.shareToken, token), eq(budgets.shareEnabled, true)));
  if (!budget?.sharePin) redirect(`/b/${token}`);

  if (budget.shareLockedUntil && budget.shareLockedUntil > new Date()) {
    return { error: "locked" };
  }

  if (!pinMatches(pin, budget.sharePin)) {
    const [updated] = await db
      .update(budgets)
      .set({ shareFailedAttempts: sql`${budgets.shareFailedAttempts} + 1` })
      .where(eq(budgets.id, budget.id))
      .returning({ attempts: budgets.shareFailedAttempts });

    if (updated.attempts >= MAX_PIN_ATTEMPTS) {
      await db
        .update(budgets)
        .set({
          shareFailedAttempts: 0,
          shareLockedUntil: new Date(Date.now() + PIN_LOCK_MINUTES * 60_000),
        })
        .where(eq(budgets.id, budget.id));
      return { error: "locked" };
    }
    return { error: "wrong", attemptsLeft: MAX_PIN_ATTEMPTS - updated.attempts };
  }

  if (budget.shareFailedAttempts > 0) {
    await db.update(budgets).set({ shareFailedAttempts: 0 }).where(eq(budgets.id, budget.id));
  }

  (await cookies()).set(accessCookieName(token), signAccess(token, budget.sharePin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/b/${token}`,
    maxAge: ACCESS_DAYS * 24 * 60 * 60,
  });
  redirect(`/b/${token}`);
}
