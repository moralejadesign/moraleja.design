import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { briefings } from "@/db/schema";
import { accessCookieName, hasValidAccess } from "./budget-share";

// Server-only helpers for the client briefing link (/f/[token]); kept out of
// the "use server" actions file so the browser can't call them directly.

export async function findBriefing(token: string) {
  const [briefing] = await db
    .select()
    .from(briefings)
    .where(and(eq(briefings.shareToken, token), eq(briefings.shareEnabled, true)));
  return briefing;
}

/** The briefing, if this browser entered the PIN and the link is still on. */
export async function authorizedBriefing(token: string) {
  const briefing = await findBriefing(token);
  if (!briefing?.sharePin) return null;
  const cookie = (await cookies()).get(accessCookieName(token, "briefing"))?.value;
  return hasValidAccess(cookie, token, briefing.sharePin) ? briefing : null;
}
