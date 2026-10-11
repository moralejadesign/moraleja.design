import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { accessCookieName, hasValidAccess } from "@/lib/budget-share";
import { budgetFileName } from "@/lib/budgets";
import { PinForm } from "./pin-form";
import { SharedBudgetView } from "./shared-budget-view";

export const metadata: Metadata = {
  title: "Budget",
  robots: { index: false, follow: false },
};

export default function SharedBudgetPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Suspense fallback={null}>
        <SharedBudget params={params} />
      </Suspense>
    </main>
  );
}

async function SharedBudget({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [budget] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.shareToken, token), eq(budgets.shareEnabled, true)));

  if (!budget?.sharePin) notFound();

  const cookie = (await cookies()).get(accessCookieName(token))?.value;
  if (!hasValidAccess(cookie, token, budget.sharePin)) {
    return <PinForm token={token} language={budget.language} />;
  }

  // Count client views, not your own checks while signed in to the admin
  const { userId } = await auth();
  if (!userId) {
    after(() =>
      db
        .update(budgets)
        .set({
          shareViewCount: sql`${budgets.shareViewCount} + 1`,
          shareLastViewedAt: new Date(),
        })
        .where(eq(budgets.id, budget.id))
    );
  }

  // Only what the document prints; internal notes never leave the server
  return (
    <SharedBudgetView
      fileName={budgetFileName(budget)}
      budget={{
        clientName: budget.clientName,
        title: budget.title,
        kind: budget.kind,
        language: budget.language,
        currency: budget.currency,
        issueDate: budget.issueDate,
        validDays: budget.validDays,
        sections: budget.sections,
        total: budget.total,
        showSectionPrices: budget.showSectionPrices,
        advancePercent: budget.advancePercent,
        showPaymentSchedule: budget.showPaymentSchedule,
        conditions: budget.conditions,
      }}
    />
  );
}
