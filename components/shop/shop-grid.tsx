"use client";

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PREDEFINED_TAGS, normalizeTag } from "@/lib/tags";
import { MasonryGrid, MasonryCard, useMasonryCardContext } from "@/components/masonry";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { imageSizes } from "@/components/optimized-image";
import { useIsBackNavigation } from "@/hooks/use-navigation-type";
import { ProductDrawer } from "./product-drawer";
import type { Product, ProductVariant, ProductType } from "@/db/schema";

type ShopProduct = Product & { variants: ProductVariant[] };

interface ShopGridProps {
  products: ShopProduct[];
  availableTags: string[];
  pageSize?: number;
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  wallpaper: "Wallpapers",
  print: "Prints",
  poster: "Posters",
};

export function ShopGrid({ products, availableTags, pageSize = 12 }: ShopGridProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | ProductType>("all");
  const [isMobile, setIsMobile] = useState(false);
  const isBackNav = useIsBackNavigation();

  // Drawer state - initialized from URL
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(() => {
    return searchParams.get("product");
  });

  const selectedProduct = selectedProductSlug
    ? products.find((p) => p.slug === selectedProductSlug) ?? null
    : null;

  const isDrawerOpen = !!selectedProduct;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync URL to local state on popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const productSlug = params.get("product");
      setSelectedProductSlug(productSlug);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update URL without triggering navigation
  const updateUrl = useCallback((productSlug: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (productSlug) {
      params.set("product", productSlug);
    } else {
      params.delete("product");
    }
    const queryString = params.toString();
    const newUrl = queryString ? `/shop?${queryString}` : "/shop";
    window.history.pushState(null, "", newUrl);
  }, []);

  const openDrawer = useCallback((slug: string) => {
    setSelectedProductSlug(slug);
    updateUrl(slug);
  }, [updateUrl]);

  const closeDrawer = useCallback(() => {
    setSelectedProductSlug(null);
    updateUrl(null);
  }, [updateUrl]);

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeDrawer();
    }
  }, [closeDrawer]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (typeFilter !== "all" && product.type !== typeFilter) {
        return false;
      }

      if (selectedTags.length > 0) {
        const productTags = (product.tags || []).map(normalizeTag);
        const hasMatchingTag = selectedTags.some((tag) =>
          productTags.includes(normalizeTag(tag))
        );
        if (!hasMatchingTag) return false;
      }

      if (search) {
        const searchLower = search.toLowerCase();
        const matchesTitle = product.title?.toLowerCase().includes(searchLower);
        const matchesDescription = product.description?.toLowerCase().includes(searchLower);
        const matchesTags = product.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [products, search, selectedTags, typeFilter]);

  const {
    visibleItems,
    hasMore,
    isLoading,
    sentinelRef,
  } = useInfiniteScroll({
    items: filteredProducts,
    pageSize,
    enabled: pageSize > 0,
  });

  const toggleTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    setSelectedTags((prev) =>
      prev.some((t) => normalizeTag(t) === normalized)
        ? prev.filter((t) => normalizeTag(t) !== normalized)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedTags([]);
    setTypeFilter("all");
  };

  const hasActiveFilters = search || selectedTags.length > 0 || typeFilter !== "all";

  // Get unique types from products
  const availableTypes = useMemo(() => {
    const types = new Set(products.map((p) => p.type));
    return Array.from(types) as ProductType[];
  }, [products]);

  return (
    <div className="relative">
      {/* Main content wrapper - shrinks when drawer is open on desktop */}
      <div
        className={`space-y-5 transition-all duration-300 ease-out ${
          isDrawerOpen && !isMobile ? "md:pr-[396px]" : ""
        }`}
      >
      {/* Filter Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-1.5 bg-transparent border-b border-border/60 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        {availableTypes.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-2 py-1 text-xs flex items-center gap-1 transition-all ${
                typeFilter === "all"
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              <span>All</span>
              {typeFilter === "all" && (
                <span className="w-1 h-1 rounded-full bg-foreground" />
              )}
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2 py-1 text-xs flex items-center gap-1 transition-all ${
                  typeFilter === type
                    ? "text-foreground"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                <span>{PRODUCT_TYPE_LABELS[type]}</span>
                {typeFilter === type && (
                  <span className="w-1 h-1 rounded-full bg-foreground" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {availableTags.length > 0 && (
          <div className="hidden md:block w-px h-4 bg-border/60" />
        )}

        {/* Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {availableTags.length > 0 && (
            <>
              {PREDEFINED_TAGS.filter((tag) =>
                availableTags.some((t) => normalizeTag(t) === normalizeTag(tag))
              ).map((tag) => {
                const isSelected = selectedTags.some(
                  (t) => normalizeTag(t) === normalizeTag(tag)
                );
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 text-xs whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-foreground text-background"
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {availableTags
                .filter(
                  (tag) =>
                    !PREDEFINED_TAGS.some(
                      (pt) => normalizeTag(pt) === normalizeTag(tag)
                    )
                )
                .map((tag) => {
                  const isSelected = selectedTags.some(
                    (t) => normalizeTag(t) === normalizeTag(tag)
                  );
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-0.5 text-xs whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-foreground text-background"
                          : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
            </>
          )}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground/60 hover:text-foreground flex items-center gap-1 whitespace-nowrap"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-xs text-muted-foreground/60 font-mono">
        {pageSize > 0 && hasMore ? (
          <>{visibleItems.length} of {filteredProducts.length}{hasActiveFilters ? ` (${products.length} total)` : ""}</>
        ) : (
          <>{filteredProducts.length}{hasActiveFilters ? ` / ${products.length}` : ""} {filteredProducts.length === 1 ? "item" : "items"}</>
        )}
      </div>

      {/* Masonry Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No products found matching your criteria.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <MasonryGrid>
            {visibleItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isMobile={isMobile}
                skipLoadingAnimation={isBackNav}
                isSelected={selectedProductSlug === product.slug}
                onClick={() => openDrawer(product.slug)}
              />
            ))}
          </MasonryGrid>

          {/* Infinite scroll sentinel */}
          {pageSize > 0 && (
            <div
              ref={sentinelRef}
              className="flex justify-center py-8"
            >
              {isLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              {!hasMore && filteredProducts.length > pageSize && (
                <span className="text-xs text-muted-foreground/50">
                  All {filteredProducts.length} items loaded
                </span>
              )}
            </div>
          )}
        </>
      )}
      </div>

      {/* Product Drawer */}
      <ProductDrawer
        product={selectedProduct}
        open={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
      />
    </div>
  );
}

interface ProductCardProps {
  product: ShopProduct;
  isMobile: boolean;
  skipLoadingAnimation?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

const ProductCard = memo(function ProductCard({ product, isMobile, skipLoadingAnimation, isSelected, onClick }: ProductCardProps) {
  const heightRatio = 1.0 + ((product.id * 7) % 9) / 10;
  const cardHeight = Math.round(heightRatio * (isMobile ? 150 : 250));

  return (
    <MasonryCard
      height={cardHeight}
      ariaLabel={product.title}
      onClick={onClick}
      className={isSelected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}
    >
      <ProductCardContent product={product} skipLoadingAnimation={skipLoadingAnimation} />
    </MasonryCard>
  );
});

interface ProductCardContentProps {
  product: ShopProduct;
  skipLoadingAnimation?: boolean;
}

function ProductCardContent({ product, skipLoadingAnimation }: ProductCardContentProps) {
  const { isHovered, onImageLoad } = useMasonryCardContext();
  const [isLoaded, setIsLoaded] = useState(skipLoadingAnimation ?? false);

  const handleLoad = () => {
    setIsLoaded(true);
    onImageLoad();
  };

  return (
    <>
      <Image
        src={product.thumbnail}
        alt={product.title}
        fill
        sizes={imageSizes.masonry}
        quality={80}
        className={`object-cover transition-all duration-700 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        } group-hover:scale-[1.03]`}
        onLoad={handleLoad}
      />

      {/* Loading skeleton */}
      {!isLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          isHovered ? "bg-white/5" : "bg-transparent"
        }`}
      />

      {/* Type badge */}
      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
        {product.type}
      </div>

      {/* Free badge */}
      {product.isFree && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-500/90 text-white text-[10px] font-medium uppercase tracking-wider">
          Free
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-black/60 to-transparent">
        <h3 className="text-xs font-semibold tracking-wide text-white md:text-sm drop-shadow-lg">
          {product.title}
        </h3>
        {product.variants && product.variants.length > 0 && (
          <p className="text-[10px] text-white/70 md:text-xs mt-0.5">
            {product.variants.length} {product.variants.length === 1 ? "size" : "sizes"} available
          </p>
        )}
        {product.tags && product.tags.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] backdrop-blur-sm">
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-white/50 text-[10px]">+{product.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
