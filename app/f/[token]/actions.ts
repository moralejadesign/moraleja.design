"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { briefings, type BriefingAnswer } from "@/db/schema";
import {
  ACCESS_DAYS,
  MAX_PIN_ATTEMPTS,
  PIN_LOCK_MINUTES,
  accessCookieName,
  pinMatches,
  signAccess,
} from "@/lib/budget-share";
import { authorizedBriefing, findBriefing } from "@/lib/briefing-access";
import type { PinState } from "@/lib/budget-share-config";
import { missingRequired, sanitizeAnswers } from "@/lib/briefings";

export async function verifyPin(token: string, _prev: PinState, formData: FormData): Promise<PinState> {
  const pin = String(formData.get("pin") ?? "");

  const briefing = await findBriefing(token);
  if (!briefing?.sharePin) redirect(`/f/${token}`);

  if (briefing.shareLockedUntil && briefing.shareLockedUntil > new Date()) {
    return { error: "locked" };
  }

  if (!pinMatches(pin, briefing.sharePin)) {
    const [updated] = await db
      .update(briefings)
      .set({ shareFailedAttempts: sql`${briefings.shareFailedAttempts} + 1` })
      .where(eq(briefings.id, briefing.id))
      .returning({ attempts: briefings.shareFailedAttempts });

    if (updated.attempts >= MAX_PIN_ATTEMPTS) {
      await db
        .update(briefings)
        .set({
          shareFailedAttempts: 0,
          shareLockedUntil: new Date(Date.now() + PIN_LOCK_MINUTES * 60_000),
        })
        .where(eq(briefings.id, briefing.id));
      return { error: "locked" };
    }
    return { error: "wrong", attemptsLeft: MAX_PIN_ATTEMPTS - updated.attempts };
  }

  if (briefing.shareFailedAttempts > 0) {
    await db.update(briefings).set({ shareFailedAttempts: 0 }).where(eq(briefings.id, briefing.id));
  }

  (await cookies()).set(accessCookieName(token, "briefing"), signAccess(token, briefing.sharePin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/f/${token}`,
    maxAge: ACCESS_DAYS * 24 * 60 * 60,
  });
  redirect(`/f/${token}`);
}

export type SaveResult = { ok: true } | { ok: false; error: "unauthorized" | "submitted" | "failed" };

/** Autosave from the client form; replaces all answers with the cleaned-up input. */
export async function saveAnswers(token: string, input: unknown): Promise<SaveResult> {
  const briefing = await authorizedBriefing(token);
  if (!briefing) return { ok: false, error: "unauthorized" };
  if (briefing.submittedAt) return { ok: false, error: "submitted" };

  try {
    await db
      .update(briefings)
      .set({
        answers: sanitizeAnswers(briefing.questions, input),
        startedAt: briefing.startedAt ?? new Date(),
        // Opening and answering moves a sent briefing along; never overrides "completed"
        ...(briefing.status === "draft" || briefing.status === "sent" ? { status: "in_progress" as const } : {}),
        updatedAt: new Date(),
      })
      .where(eq(briefings.id, briefing.id));
    return { ok: true };
  } catch (error) {
    console.error("Failed to save briefing answers:", error);
    return { ok: false, error: "failed" };
  }
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "submitted" | "failed" }
  | { ok: false; error: "missing"; missing: string[] };

/** Final save; locks the answers until you reopen the briefing in the admin. */
export async function submitBriefing(token: string, input: unknown): Promise<SubmitResult> {
  const briefing = await authorizedBriefing(token);
  if (!briefing) return { ok: false, error: "unauthorized" };
  if (briefing.submittedAt) return { ok: false, error: "submitted" };

  const answers: Record<string, BriefingAnswer> = sanitizeAnswers(briefing.questions, input);
  const missing = missingRequired(briefing.questions, answers);
  if (missing.length) return { ok: false, error: "missing", missing: missing.map((q) => q.id) };

  try {
    const now = new Date();
    await db
      .update(briefings)
      .set({
        answers,
        startedAt: briefing.startedAt ?? now,
        submittedAt: now,
        status: "completed",
        updatedAt: now,
      })
      .where(eq(briefings.id, briefing.id));
    return { ok: true };
  } catch (error) {
    console.error("Failed to submit briefing:", error);
    return { ok: false, error: "failed" };
  }
}
