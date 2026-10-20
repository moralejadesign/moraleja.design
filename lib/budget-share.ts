import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export { ACCESS_DAYS, MAX_PIN_ATTEMPTS, PIN_LOCK_MINUTES } from "./budget-share-config";

/** Unguessable link id: 18 random bytes, base64url (24 chars). */
export function generateShareToken() {
  return randomBytes(18).toString("base64url");
}

export function generatePin() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Cookie set after the PIN is entered; briefings use their own prefix and path (/f/). */
export function accessCookieName(token: string, kind: "budget" | "briefing" = "budget") {
  return `${kind}_${token}`;
}

export type ShareAction = "create" | "enable" | "disable" | "new-pin" | "new-link" | "unlock";

type ShareFields = {
  shareToken: string | null;
  sharePin: string | null;
  shareEnabled: boolean;
  shareFailedAttempts: number;
  shareLockedUntil: Date | null;
  shareViewCount: number;
  shareLastViewedAt: Date | null;
};

/** Column changes for a client-link action, shared by budgets and briefings; null if unknown. */
export function shareChanges(
  action: ShareAction,
  current: Pick<ShareFields, "shareToken" | "sharePin">
): Partial<ShareFields> | null {
  const unlock = { shareFailedAttempts: 0, shareLockedUntil: null };
  switch (action) {
    case "create":
      return {
        shareToken: current.shareToken ?? generateShareToken(),
        sharePin: current.sharePin ?? generatePin(),
        shareEnabled: true,
        ...unlock,
      };
    case "enable":
      return { shareEnabled: true };
    case "disable":
      return { shareEnabled: false };
    case "new-pin":
      return { sharePin: generatePin(), ...unlock };
    case "new-link":
      return { shareToken: generateShareToken(), shareViewCount: 0, shareLastViewedAt: null, ...unlock };
    case "unlock":
      return unlock;
    default:
      return null;
  }
}

function secret() {
  const value = process.env.BUDGET_SHARE_SECRET || process.env.CLERK_SECRET_KEY;
  if (!value) throw new Error("BUDGET_SHARE_SECRET is not set");
  return value;
}

/** Cookie proving the PIN was entered; changing the PIN invalidates it. */
export function signAccess(token: string, pin: string) {
  return createHmac("sha256", secret()).update(`${token}:${pin}`).digest("base64url");
}

export function hasValidAccess(cookie: string | undefined, token: string, pin: string) {
  if (!cookie) return false;
  const expected = Buffer.from(signAccess(token, pin));
  const actual = Buffer.from(cookie);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function pinMatches(input: string, pin: string) {
  const a = Buffer.from(input.trim());
  const b = Buffer.from(pin);
  return a.length === b.length && timingSafeEqual(a, b);
}
