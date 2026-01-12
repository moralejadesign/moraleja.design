import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, products, productVariants } from "@/db";
import { asc, desc, eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";
    const type = searchParams.get("type");

    let query = db
      .select()
      .from(products);

    const conditions = [];
    
    if (!includeUnpublished) {
      conditions.push(eq(products.isPublished, true));
    }
    
    if (type && ["wallpaper", "print", "poster"].includes(type)) {
      conditions.push(eq(products.type, type as "wallpaper" | "print" | "poster"));
    }

    const allProducts = await db
      .select()
      .from(products)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(asc(products.position), desc(products.createdAt));

    // Fetch variants for each product
    const productsWithVariants = await Promise.all(
      allProducts.map(async (product) => {
        const variants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, product.id));
        return { ...product, variants };
      })
    );

    return NextResponse.json(productsWithVariants);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Get max position to add new product at the end
    const [maxResult] = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${products.position}), -1)` })
      .from(products);
    const nextPosition = (maxResult?.maxPos ?? -1) + 1;

    const [newProduct] = await db
      .insert(products)
      .values({
        slug: body.slug,
        title: body.title,
        type: body.type,
        description: body.description,
        thumbnail: body.thumbnail,
        price: body.price ?? "0.00",
        isFree: body.isFree ?? true,
        isPublished: body.isPublished ?? false,
        position: nextPosition,
        tags: body.tags ?? [],
      })
      .returning();

    // Insert variants if provided
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      await db.insert(productVariants).values(
        body.variants.map((v: { label: string; url: string; width?: number; height?: number; fileSize?: string }) => ({
          productId: newProduct.id,
          label: v.label,
          url: v.url,
          width: v.width,
          height: v.height,
          fileSize: v.fileSize,
        }))
      );
    }

    // Return product with variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, newProduct.id));

    return NextResponse.json({ ...newProduct, variants }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
