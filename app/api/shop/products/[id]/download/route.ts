import { NextResponse } from "next/server";
import { db, productVariants } from "@/db";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { variantId } = await request.json() as { variantId: number };

    if (!variantId) {
      return NextResponse.json({ error: "variantId is required" }, { status: 400 });
    }

    // Increment download count
    await db
      .update(productVariants)
      .set({
        downloadCount: sql`${productVariants.downloadCount} + 1`,
      })
      .where(eq(productVariants.id, variantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track download:", error);
    return NextResponse.json({ error: "Failed to track download" }, { status: 500 });
  }
}
