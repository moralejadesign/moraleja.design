import { NextResponse } from "next/server";
import { db } from "@/db";
import { billingProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";

const EMPTY = { id: 1, fullName: "", idNumber: "", city: "", paymentDetails: "", updatedAt: null };

export async function GET() {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [profile] = await db.select().from(billingProfile).where(eq(billingProfile.id, 1));
    return NextResponse.json(profile ?? EMPTY);
  } catch (error) {
    console.error("Failed to fetch billing profile:", error);
    return NextResponse.json({ error: "Failed to fetch billing profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const values = {
      fullName: String(body.fullName ?? "").trim(),
      idNumber: String(body.idNumber ?? "").trim(),
      city: String(body.city ?? "").trim(),
      paymentDetails: String(body.paymentDetails ?? "").trim(),
      updatedAt: new Date(),
    };

    const [saved] = await db
      .insert(billingProfile)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: billingProfile.id, set: values })
      .returning();

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Failed to save billing profile:", error);
    return NextResponse.json({ error: "Failed to save billing profile" }, { status: 500 });
  }
}
