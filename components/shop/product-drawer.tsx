"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Download, Monitor, Smartphone, FileText, Check, Loader2, ExternalLink } from "lucide-react";
import { Drawer } from "vaul";
import type { Product, ProductVariant } from "@/db/schema";

type ProductWithVariants = Product & { variants: ProductVariant[] };

interface ProductDrawerProps {
  product: ProductWithVariants | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDrawer({ product, open, onOpenChange }: ProductDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!product) return null;

  if (isMobile) {
    return (
      <MobileDrawer
        product={product}
        open={open}
        onOpenChange={onOpenChange}
      />
    );
  }

  return (
    <DesktopPanel
      product={product}
      open={open}
      onClose={() => onOpenChange(false)}
    />
  );
}

interface DesktopPanelProps {
  product: ProductWithVariants;
  open: boolean;
  onClose: () => void;
}

function DesktopPanel({ product, open, onClose }: DesktopPanelProps) {
  return (
    <div
      className={`fixed top-0 right-0 h-full bg-background border-l border-border z-40 transition-all duration-300 ease-out ${
        open ? "w-[380px] translate-x-0" : "w-0 translate-x-full"
      }`}
      style={{ top: "var(--header-height, 64px)", height: "calc(100vh - var(--header-height, 64px))" }}
    >
      <div className={`h-full overflow-hidden ${open ? "opacity-100" : "opacity-0"} transition-opacity duration-200 delay-100`}>
        <div className="h-full overflow-y-auto">
          <DrawerContent product={product} onClose={onClose} showCloseButton />
        </div>
      </div>
    </div>
  );
}

interface MobileDrawerProps {
  product: ProductWithVariants;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MobileDrawer({ product, open, onOpenChange }: MobileDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background rounded-t-[20px] max-h-[85vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 my-3" />
          <div className="flex-1 overflow-y-auto pb-safe">
            <DrawerContent product={product} onClose={() => onOpenChange(false)} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

interface DrawerContentProps {
  product: ProductWithVariants;
  onClose: () => void;
  showCloseButton?: boolean;
}

function DrawerContent({ product, onClose, showCloseButton }: DrawerContentProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<number>>(new Set());

  // Reset download state when product changes
  useEffect(() => {
    setDownloadedIds(new Set());
  }, [product.id]);

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
    <div className="p-4 md:p-6 space-y-5">
      {/* Header with close button */}
      {showCloseButton && (
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {product.type}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="400px"
          quality={85}
          className="object-cover"
        />
        {product.isFree && (
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-green-500/90 text-white text-[10px] font-medium uppercase tracking-wider">
            Free
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">{product.title}</h2>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-muted text-muted-foreground text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Downloads */}
      <div className="pt-3 border-t border-border">
        <h3 className="text-sm font-medium mb-3">
          Downloads ({product.variants.length})
        </h3>

        {product.variants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No variants available.</p>
        ) : (
          <div className="space-y-2">
            {product.variants.map((variant) => {
              const dimensions = formatDimensions(variant);
              const isDownloading = downloadingId === variant.id;
              const isDownloaded = downloadedIds.has(variant.id);

              return (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-3 border border-border hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="text-muted-foreground flex-shrink-0">
                      {getVariantIcon(variant.label)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{variant.label}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        {dimensions && <span>{dimensions}</span>}
                        {dimensions && variant.fileSize && <span>•</span>}
                        {variant.fileSize && <span>{variant.fileSize}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(variant)}
                    disabled={isDownloading}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                      isDownloaded
                        ? "bg-green-500/10 text-green-600 border border-green-500/30"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    } disabled:opacity-50`}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isDownloaded ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full page link */}
      <Link
        href={`/shop/${product.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        View full page
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>

      {/* License */}
      <div className="text-[11px] text-muted-foreground pt-2 border-t border-border">
        Free for personal use.{" "}
        <Link href="/contact" className="underline hover:text-foreground">
          Contact us
        </Link>{" "}
        for commercial licensing.
      </div>
    </div>
  );
}
