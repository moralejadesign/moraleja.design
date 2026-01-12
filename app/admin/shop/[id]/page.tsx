"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import type { Product, ProductVariant } from "@/db/schema";

type ProductWithVariants = Product & { variants: ProductVariant[] };

async function fetchProduct(id: string): Promise<ProductWithVariants> {
  const res = await fetch(`/api/shop/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["shop-product", id],
    queryFn: () => fetchProduct(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return <ProductForm product={product} />;
}
