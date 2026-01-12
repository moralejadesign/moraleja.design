import { NextResponse } from "next/server";
import { db, productVariants, products } from "@/db";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;
    const id = parseInt(variantId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid variant ID" }, { status: 400 });
    }

    // Get variant with product info
    const [variant] = await db
      .select({
        id: productVariants.id,
        url: productVariants.url,
        label: productVariants.label,
        productId: productVariants.productId,
        productTitle: products.title,
        productSlug: products.slug,
        isPublished: products.isPublished,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.id, id));

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    // Check if product is published (for future: check payment status here)
    if (!variant.isPublished) {
      return NextResponse.json({ error: "Product not available" }, { status: 403 });
    }

    // Fetch the file from Vercel Blob
    const fileResponse = await fetch(variant.url);
    
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get content type from the response
    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
    
    // Generate a clean filename
    const extension = getExtensionFromContentType(contentType);
    const safeTitle = variant.productTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const safeLabel = variant.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `${safeTitle}-${safeLabel}${extension}`;

    // Increment download count
    await db
      .update(productVariants)
      .set({
        downloadCount: sql`${productVariants.downloadCount} + 1`,
      })
      .where(eq(productVariants.id, id));

    // Stream the file with download headers
    return new NextResponse(fileResponse.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

function getExtensionFromContentType(contentType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "application/pdf": ".pdf",
    "image/tiff": ".tiff",
  };
  
  return mimeToExt[contentType] || "";
}
