import { auth } from "@clerk/nextjs/server";

/**
 * Signed-in user allowed to manage private data (budgets).
 * Set ADMIN_USER_IDS (comma-separated Clerk user IDs) to lock it to specific
 * accounts; without it, any signed-in user passes, like the rest of the admin.
 */
export async function getAdminUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const allowed = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (allowed.length > 0 && !allowed.includes(userId)) return null;
  return userId;
}
