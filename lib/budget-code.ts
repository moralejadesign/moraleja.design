import { db } from "@/db";
import { budgets } from "@/db/schema";
import { like } from "drizzle-orm";

/** Next code for the year: MOR-2026-001, MOR-2026-002… */
export async function nextBudgetCode() {
  const year = new Date().getFullYear();
  const prefix = `MOR-${year}-`;
  const existing = await db
    .select({ code: budgets.code })
    .from(budgets)
    .where(like(budgets.code, `${prefix}%`));
  const max = existing.reduce(
    (acc, { code }) => Math.max(acc, parseInt(code.slice(prefix.length), 10) || 0),
    0
  );
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}
