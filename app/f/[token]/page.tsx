import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { briefings } from "@/db/schema";
import { accessCookieName, hasValidAccess } from "@/lib/budget-share";
import { briefingHeading } from "@/lib/briefings";
import { PinForm } from "@/components/pin-form";
import { verifyPin } from "./actions";
import { BriefingForm } from "./briefing-form";

export const metadata: Metadata = {
  title: "Briefing",
  robots: { index: false, follow: false },
};

export default function SharedBriefingPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] text-white">
      <Suspense fallback={null}>
        <SharedBriefing params={params} />
      </Suspense>
    </main>
  );
}

async function SharedBriefing({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [briefing] = await db
    .select()
    .from(briefings)
    .where(and(eq(briefings.shareToken, token), eq(briefings.shareEnabled, true)));

  if (!briefing?.sharePin) notFound();

  const cookie = (await cookies()).get(accessCookieName(token, "briefing"))?.value;
  if (!hasValidAccess(cookie, token, briefing.sharePin)) {
    return <PinForm verify={verifyPin.bind(null, token)} language={briefing.language} kind="briefing" />;
  }

  // Count client visits, not your own checks while signed in to the admin
  const { userId } = await auth();
  if (!userId) {
    after(() =>
      db
        .update(briefings)
        .set({
          shareViewCount: sql`${briefings.shareViewCount} + 1`,
          shareLastViewedAt: new Date(),
        })
        .where(eq(briefings.id, briefing.id))
    );
  }

  // Only what the client needs; notes and internal fields never leave the server
  return (
    <BriefingForm
      token={token}
      heading={briefingHeading(briefing)}
      intro={briefing.intro ?? ""}
      language={briefing.language}
      questions={briefing.questions}
      initialAnswers={briefing.answers}
      submitted={briefing.submittedAt !== null}
    />
  );
}
