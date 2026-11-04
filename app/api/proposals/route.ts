import { NextResponse } from "next/server";
import { desc, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { proposalComments, proposalVersions, proposals, type BudgetLanguage } from "@/db/schema";
import { getAdminUserId } from "@/lib/admin-auth";
import { DEFAULT_INTRO, type ProposalListItem } from "@/lib/proposals";
import { nextProposalCode } from "@/lib/budget-code";

export async function GET() {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db.select().from(proposals).orderBy(desc(proposals.createdAt));
    const ids = items.map((p) => p.id);
    const versions = ids.length
      ? await db
          .select({
            id: proposalVersions.id,
            proposalId: proposalVersions.proposalId,
            number: proposalVersions.number,
            slides: sql<number>`jsonb_array_length(${proposalVersions.slides})`,
          })
          .from(proposalVersions)
          .where(inArray(proposalVersions.proposalId, ids))
      : [];
    // Client comments only, counted per round; replies included
    const counts = versions.length
      ? await db
          .select({
            versionId: proposalComments.versionId,
            total: sql<number>`count(*)::int`,
            unresolved: sql<number>`count(*) filter (where ${isNull(proposalComments.resolvedAt)} and ${proposalComments.parentId} is null and not ${proposalComments.isAdmin})::int`,
          })
          .from(proposalComments)
          .where(inArray(proposalComments.versionId, versions.map((v) => v.id)))
          .groupBy(proposalComments.versionId)
      : [];

    const result: ProposalListItem[] = items.map((p) => {
      const own = versions.filter((v) => v.proposalId === p.id);
      const current = own.find((v) => v.id === p.currentVersionId);
      const currentCounts = counts.find((c) => c.versionId === current?.id);
      return {
        ...p,
        rounds: own.length,
        currentRound: current?.number ?? null,
        slides: Number(current?.slides ?? 0),
        comments: currentCounts?.total ?? 0,
        unresolved: currentCounts?.unresolved ?? 0,
      };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch proposals:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const language: BudgetLanguage = body.language === "en" ? "en" : "es";

    if (!body.clientName?.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(proposals)
      .values({
        code: await nextProposalCode(),
        clientName: body.clientName.trim(),
        title: body.title?.trim() || null,
        language,
        intro: DEFAULT_INTRO[language],
      })
      .returning();

    // Every proposal starts with an empty first round to upload into
    await db.insert(proposalVersions).values({ proposalId: created.id, number: 1 });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create proposal:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
