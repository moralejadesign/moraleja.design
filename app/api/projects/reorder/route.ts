import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, projects } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderedIds } = await request.json() as { orderedIds: number[] };
    
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 });
    }

    // Update each project's position based on array index
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(projects)
          .set({ position: index, updatedAt: new Date() })
          .where(eq(projects.id, id))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder projects:", error);
    return NextResponse.json({ error: "Failed to reorder projects" }, { status: 500 });
  }
}








