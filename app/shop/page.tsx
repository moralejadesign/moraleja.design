import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ShopGrid } from "@/components/shop/shop-grid";
import { db, products, productVariants } from "@/db";
import { desc, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Download free wallpapers, prints, and digital artwork.",
};

async function getProducts() {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isPublished, true))
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

  return productsWithVariants;
}

async function getAllTags() {
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20">
        <div className="w-full px-3 py-8 md:px-8 md:py-12 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Shop</h1>
              <p className="text-muted-foreground">
                Free wallpapers and digital artwork for download
              </p>
            </div>
            <Suspense fallback={<div className="text-muted-foreground">Loading shop...</div>}>
              <ShopGrid products={allProducts} availableTags={allTags} />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
