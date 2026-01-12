import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductDetail } from "@/components/shop/product-detail";
import { db, products, productVariants } from "@/db";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
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

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20">
        <ProductDetail product={product} />
      </main>
      <Footer />
    </div>
  );
}
