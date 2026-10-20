import { db } from "@/db";
import { briefings, budgets } from "@/db/schema";
import { like } from "drizzle-orm";

/** Next number for the year after the highest existing code with this prefix. */
function nextInSequence(codes: { code: string }[], prefix: string) {
  const max = codes.reduce(
    (acc, { code }) => Math.max(acc, parseInt(code.slice(prefix.length), 10) || 0),
    0
  );
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

/** Next code for the year: MOR-2026-001, MOR-2026-002… */
export async function nextBudgetCode() {
  const prefix = `MOR-${new Date().getFullYear()}-`;
  const existing = await db
    .select({ code: budgets.code })
    .from(budgets)
    .where(like(budgets.code, `${prefix}%`));
  return nextInSequence(existing, prefix);
}

/** Next briefing code for the year: BRF-2026-001… */
export async function nextBriefingCode() {
  const prefix = `BRF-${new Date().getFullYear()}-`;
  const existing = await db
    .select({ code: briefings.code })
    .from(briefings)
    .where(like(briefings.code, `${prefix}%`));
  return nextInSequence(existing, prefix);
}
