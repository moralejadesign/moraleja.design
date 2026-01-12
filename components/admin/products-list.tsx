"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, GripVertical, Eye, EyeOff } from "lucide-react";
import type { Product, ProductVariant } from "@/db/schema";
import { useState, useRef } from "react";

type ProductWithVariants = Product & { variants: ProductVariant[] };

async function fetchProducts(): Promise<ProductWithVariants[]> {
  const res = await fetch("/api/shop/products?includeUnpublished=true");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`/api/shop/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete product");
}

async function reorderProducts(orderedIds: number[]): Promise<void> {
  const res = await fetch("/api/shop/products/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder products");
}

async function togglePublished(id: number, isPublished: boolean): Promise<void> {
  const res = await fetch(`/api/shop/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPublished }),
  });
  if (!res.ok) throw new Error("Failed to update product");
}

export function ProductsList() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const draggedIndex = useRef<number | null>(null);

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["shop-products"],
    queryFn: fetchProducts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onMutate: async (id) => {
      setDeletingId(id);
      await queryClient.cancelQueries({ queryKey: ["shop-products"] });
      const previousProducts = queryClient.getQueryData<ProductWithVariants[]>(["shop-products"]);
      queryClient.setQueryData<ProductWithVariants[]>(["shop-products"], (old) =>
        old?.filter((p) => p.id !== id)
      );
      return { previousProducts };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["shop-products"], context?.previousProducts);
    },
    onSettled: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderProducts,
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["shop-products"] });
      const previousProducts = queryClient.getQueryData<ProductWithVariants[]>(["shop-products"]);
      
      if (previousProducts) {
        const reordered = orderedIds
          .map((id) => previousProducts.find((p) => p.id === id))
          .filter(Boolean) as ProductWithVariants[];
        queryClient.setQueryData<ProductWithVariants[]>(["shop-products"], reordered);
      }
      
      return { previousProducts };
    },
    onError: (err, orderedIds, context) => {
      queryClient.setQueryData(["shop-products"], context?.previousProducts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
      togglePublished(id, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, id: number, index: number) => {
    setDraggedId(id);
    draggedIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    draggedIndex.current = null;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!products || draggedIndex.current === null || draggedIndex.current === targetIndex) {
      handleDragEnd();
      return;
    }

    const newOrder = [...products];
    const [removed] = newOrder.splice(draggedIndex.current, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    const orderedIds = newOrder.map((p) => p.id);
    reorderMutation.mutate(orderedIds);
    
    handleDragEnd();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load products. Please try again.
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No products yet</p>
        <Link
          href="/admin/shop/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create your first product
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Drag to reorder • Changes save automatically
      </p>
      {products.map((product, index) => (
        <div
          key={product.id}
          draggable
          onDragStart={(e) => handleDragStart(e, product.id, index)}
          onDragOver={(e) => handleDragOver(e, product.id)}
          onDragEnd={handleDragEnd}
          onDrop={(e) => handleDrop(e, index)}
          className={`flex items-center gap-3 p-4 border transition-all ${
            draggedId === product.id
              ? "opacity-50 border-foreground/30"
              : dragOverId === product.id
              ? "border-foreground bg-muted/50"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          {product.thumbnail && (
            <div className="w-14 h-14 overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{product.title}</h3>
              <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs capitalize">
                {product.type}
              </span>
              {!product.isPublished && (
                <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 text-xs">
                  Draft
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              /shop/{product.slug} • {product.variants?.length || 0} variant{product.variants?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMutation.mutate({ id: product.id, isPublished: !product.isPublished });
              }}
              disabled={toggleMutation.isPending}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={product.isPublished ? "Unpublish" : "Publish"}
            >
              {product.isPublished ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
            <Link
              href={`/shop/${product.slug}`}
              target="_blank"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="View live"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/shop/${product.id}`}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this product?")) {
                  deleteMutation.mutate(product.id);
                }
              }}
              disabled={deletingId === product.id}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
