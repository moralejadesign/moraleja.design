import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { labProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 });
    }

    await Promise.all(
      orderedIds.map((id: number, index: number) =>
        db
          .update(labProjects)
          .set({ position: index })
          .where(eq(labProjects.id, id))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder lab projects:", error);
    return NextResponse.json({ error: "Failed to reorder lab projects" }, { status: 500 });
  }
}
