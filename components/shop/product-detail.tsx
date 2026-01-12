"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Monitor, Smartphone, FileText, Check, Loader2 } from "lucide-react";
import type { Product, ProductVariant } from "@/db/schema";

type ProductWithVariants = Product & { variants: ProductVariant[] };

interface ProductDetailProps {
  product: ProductWithVariants;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<number>>(new Set());

  const handleDownload = async (variant: ProductVariant) => {
    setDownloadingId(variant.id);

    try {
      // Use the server proxy route for reliable downloads
      const link = document.createElement("a");
      link.href = `/api/shop/download/${variant.id}`;
      link.download = ""; // Browser will use filename from Content-Disposition
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Mark as downloaded
      setDownloadedIds((prev) => new Set(prev).add(variant.id));
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const getVariantIcon = (label: string) => {
    const labelLower = label.toLowerCase();
    if (labelLower.includes("mobile") || labelLower.includes("phone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (labelLower.includes("pdf") || labelLower.includes("print")) {
      return <FileText className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const formatDimensions = (variant: ProductVariant) => {
    if (variant.width && variant.height) {
      return `${variant.width} × ${variant.height}`;
    }
    return null;
  };

  return (
    <div className="w-full px-3 py-8 md:px-8 md:py-12 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Back button */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={90}
              priority
              className="object-cover"
            />
            {product.isFree && (
              <div className="absolute top-4 left-4 px-2.5 py-1 bg-green-500/90 text-white text-xs font-medium uppercase tracking-wider">
                Free Download
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {product.type}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
                {product.title}
              </h1>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-muted text-muted-foreground text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Download Section */}
            <div className="pt-4 border-t border-border">
              <h2 className="text-sm font-semibold mb-4">
                Available Downloads ({product.variants.length})
              </h2>

              {product.variants.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No download variants available yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {product.variants.map((variant) => {
                    const dimensions = formatDimensions(variant);
                    const isDownloading = downloadingId === variant.id;
                    const isDownloaded = downloadedIds.has(variant.id);

                    return (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-4 border border-border hover:border-foreground/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-muted-foreground">
                            {getVariantIcon(variant.label)}
                          </div>
                          <div>
                            <div className="font-medium">{variant.label}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              {dimensions && <span>{dimensions}</span>}
                              {dimensions && variant.fileSize && <span>•</span>}
                              {variant.fileSize && <span>{variant.fileSize}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(variant)}
                          disabled={isDownloading}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                            isDownloaded
                              ? "bg-green-500/10 text-green-600 border border-green-500/30"
                              : "bg-foreground text-background hover:bg-foreground/90"
                          } disabled:opacity-50`}
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Downloading...
                            </>
                          ) : isDownloaded ? (
                            <>
                              <Check className="h-4 w-4" />
                              Downloaded
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* License info */}
            <div className="pt-4 text-xs text-muted-foreground">
              <p>
                Free for personal use. For commercial use, please{" "}
                <Link href="/contact" className="underline hover:text-foreground">
                  contact us
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
