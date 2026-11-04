import { NextResponse } from "next/server";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { proposalVersions, proposals } from "@/db/schema";
import { getAdminUserId } from "@/lib/admin-auth";

/** Starts the next round (R2, R3…). It stays hidden from the client until you show it. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const proposalId = parseInt(id, 10);
    const [proposal] = await db.select({ id: proposals.id }).from(proposals).where(eq(proposals.id, proposalId));
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const [{ last }] = await db
      .select({ last: max(proposalVersions.number) })
      .from(proposalVersions)
      .where(eq(proposalVersions.proposalId, proposalId));

    const [created] = await db
      .insert(proposalVersions)
      .values({ proposalId, number: (last ?? 0) + 1 })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create round:", error);
    return NextResponse.json({ error: "Failed to create round" }, { status: 500 });
  }
}
