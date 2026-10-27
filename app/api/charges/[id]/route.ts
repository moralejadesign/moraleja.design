import { NextResponse } from "next/server";
import { db } from "@/db";
import { chargeAccounts, type NewChargeAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUserId } from "@/lib/admin-auth";

// Fields the editor may change; code and budget link are fixed
const EDITABLE_FIELDS = [
  "clientName",
  "clientTaxId",
  "language",
  "currency",
  "status",
  "issueDate",
  "city",
  "items",
  "paymentDetails",
  "notes",
  "paidAt",
  "internalNotes",
] as const satisfies readonly (keyof NewChargeAccount)[];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const [item] = await db.select().from(chargeAccounts).where(eq(chargeAccounts.id, parseInt(id, 10)));

    if (!item) {
      return NextResponse.json({ error: "Charge account not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch charge account:", error);
    return NextResponse.json({ error: "Failed to fetch charge account" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const changes: Partial<NewChargeAccount> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) (changes as Record<string, unknown>)[field] = body[field];
    }
    if (changes.paidAt === "") changes.paidAt = null;

    const [updated] = await db
      .update(chargeAccounts)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(chargeAccounts.id, parseInt(id, 10)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Charge account not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update charge account:", error);
    return NextResponse.json({ error: "Failed to update charge account" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(chargeAccounts)
      .where(eq(chargeAccounts.id, parseInt(id, 10)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Charge account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete charge account:", error);
    return NextResponse.json({ error: "Failed to delete charge account" }, { status: 500 });
  }
}
