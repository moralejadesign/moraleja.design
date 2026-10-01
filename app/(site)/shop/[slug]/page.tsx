import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { db, products, productVariants } from "@/db";
import { eq, and } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag("products");
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isPublished, true)));

  if (!product) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  return { ...product, variants };
}

async function getPublishedSlugs() {
  "use cache";
  cacheLife("max");
  cacheTag("products");
  return db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.isPublished, true));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.title,
    description: product.description || `Download ${product.title} - free ${product.type} for personal use.`,
    openGraph: {
      title: product.title,
      description: product.description || `Download ${product.title} - free ${product.type} for personal use.`,
      images: product.thumbnail ? [{ url: product.thumbnail }] : undefined,
    },
  };
}

export async function generateStaticParams() {
  return getPublishedSlugs();
}

async function ProductContent({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}

export default function ProductPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <ProductContent params={params} />
    </Suspense>
  );
}
