import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export { ACCESS_DAYS, MAX_PIN_ATTEMPTS, PIN_LOCK_MINUTES } from "./budget-share-config";

/** Unguessable link id: 18 random bytes, base64url (24 chars). */
export function generateShareToken() {
  return randomBytes(18).toString("base64url");
}

export function generatePin() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function accessCookieName(token: string) {
  return `budget_${token}`;
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
