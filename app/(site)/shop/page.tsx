import { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/page-intro";
import { ShopGrid } from "@/components/shop/shop-grid";
import { db, products, productVariants } from "@/db";
import { desc, asc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export const metadata: Metadata = {
  title: "Shop",
  description: "Download free wallpapers, prints, and digital artwork.",
};

async function getProducts() {
  "use cache";
  cacheLife("max");
  cacheTag("products");
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isPublished, true))
    .orderBy(asc(products.position), desc(products.createdAt));

  // One query for every product's variants
  const variants = allProducts.length
    ? await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, allProducts.map((product) => product.id)))
    : [];

  return allProducts.map((product) => ({
    ...product,
    variants: variants.filter((variant) => variant.productId === product.id),
  }));
}

async function getAllTags() {
  "use cache";
  cacheLife("max");
  cacheTag("products");
  const result = await db
    .select({ tags: products.tags })
    .from(products)
    .where(eq(products.isPublished, true));

  const allTags = new Set<string>();
  result.forEach((row) => {
    row.tags?.forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

export default async function ShopPage() {
  const [allProducts, allTags] = await Promise.all([getProducts(), getAllTags()]);

  return (
    <>
      <PageIntro name="Shop" statement="is free artwork to take home." lede="Wallpapers, prints and digital pieces, free to download." />
      <Suspense fallback={<div className="text-muted-foreground">Loading shop...</div>}>
        <ShopGrid products={allProducts} availableTags={allTags} />
      </Suspense>
    </>
  );
}
