import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, products, productVariants } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Support both numeric ID and slug lookup
    const isNumeric = /^\d+$/.test(id);
    
    const [product] = isNumeric
      ? await db.select().from(products).where(eq(products.id, parseInt(id, 10)))
      : await db.select().from(products).where(eq(products.slug, id));

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));

    return NextResponse.json({ ...product, variants });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    const body = await request.json();

    // Extract variants from body if present
    const { variants: newVariants, ...productData } = body;

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Handle variants update if provided
    if (newVariants !== undefined && Array.isArray(newVariants)) {
      // Delete existing variants and insert new ones
      await db.delete(productVariants).where(eq(productVariants.productId, productId));
      
      if (newVariants.length > 0) {
        await db.insert(productVariants).values(
          newVariants.map((v: { label: string; url: string; width?: number; height?: number; fileSize?: string }) => ({
            productId,
            label: v.label,
            url: v.url,
            width: v.width,
            height: v.height,
            fileSize: v.fileSize,
          }))
        );
      }
    }

    // Return product with variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    return NextResponse.json({ ...updatedProduct, variants });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    // Variants are deleted automatically due to cascade
    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, productId))
      .returning();

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
