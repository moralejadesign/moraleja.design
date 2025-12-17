"use client";

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { Search, X, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PREDEFINED_TAGS, normalizeTag } from "@/lib/tags";
import { ImageViewer } from "@/components/image-viewer";
import { markImageCached } from "@/lib/image-cache";
import { MasonryGrid, MasonryCard, useMasonryCardContext } from "@/components/masonry";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { imageSizes } from "@/components/optimized-image";
import { useIsBackNavigation } from "@/hooks/use-navigation-type";

type GalleryAsset = {
  id: number;
  url: string;
  type: string;
  title: string | null;
  description: string | null;
  altText: string | null;
  tags: string[] | null;
  projectId: number | null;
  projectTitle: string | null;
  projectSlug: string | null;
};

interface GalleryGridProps {
  assets: GalleryAsset[];
  availableTags: string[];
  /** Items per page for infinite scroll. Set to 0 to disable pagination. */
  pageSize?: number;
}

export function GalleryGrid({ assets, availableTags, pageSize = 9 }: GalleryGridProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [isMobile, setIsMobile] = useState(false);
  const isBackNav = useIsBackNavigation();
  
  // Local state for lightbox - prevents re-renders on URL change
  const [viewingAssetId, setViewingAssetId] = useState<number | null>(() => {
    const photoParam = searchParams.get("photo");
    return photoParam ? parseInt(photoParam, 10) : null;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync URL to local state on initial load and popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const photoId = params.get("photo");
      setViewingAssetId(photoId ? parseInt(photoId, 10) : null);
    };
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const selectedAsset = viewingAssetId
    ? assets.find((a) => a.id === viewingAssetId)
    : null;

  // Update URL without triggering React navigation (no re-render)
  const updateUrl = useCallback((photoId: number | null) => {
    const params = new URLSearchParams(window.location.search);
    if (photoId) {
      params.set("photo", photoId.toString());
    } else {
      params.delete("photo");
    }
    const queryString = params.toString();
    const newUrl = queryString ? `/gallery?${queryString}` : "/gallery";
    window.history.pushState(null, "", newUrl);
  }, []);

  const openViewer = useCallback((assetId: number) => {
    setViewingAssetId(assetId);
    updateUrl(assetId);
  }, [updateUrl]);

  const closeViewer = useCallback(() => {
    setViewingAssetId(null);
    updateUrl(null);
  }, [updateUrl]);

  const navigateViewer = useCallback((assetId: number) => {
    setViewingAssetId(assetId);
    // Use replaceState for navigation within lightbox (no history entry)
    const params = new URLSearchParams(window.location.search);
    params.set("photo", assetId.toString());
    window.history.replaceState(null, "", `/gallery?${params.toString()}`);
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (typeFilter !== "all" && asset.type !== typeFilter) {
        return false;
      }

      if (selectedTags.length > 0) {
        const assetTags = (asset.tags || []).map(normalizeTag);
        const hasMatchingTag = selectedTags.some((tag) =>
          assetTags.includes(normalizeTag(tag))
        );
        if (!hasMatchingTag) return false;
      }

      if (search) {
        const searchLower = search.toLowerCase();
        const matchesTitle = asset.title?.toLowerCase().includes(searchLower);
        const matchesDescription = asset.description?.toLowerCase().includes(searchLower);
        const matchesAlt = asset.altText?.toLowerCase().includes(searchLower);
        const matchesTags = asset.tags?.some((tag) => tag.toLowerCase().includes(searchLower));
        const matchesProject = asset.projectTitle?.toLowerCase().includes(searchLower);

        if (!matchesTitle && !matchesDescription && !matchesAlt && !matchesTags && !matchesProject) {
          return false;
        }
      }

      return true;
    });
  }, [assets, search, selectedTags, typeFilter]);

  // Infinite scroll pagination
  const {
    visibleItems,
    hasMore,
    isLoading,
    sentinelRef,
  } = useInfiniteScroll({
    items: filteredAssets,
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

  return (
    <div className="space-y-5">
      {/* Compact Filter Bar */}
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

        {/* Type Filter - Inline Pills */}
        <div className="flex items-center gap-1">
          {(["all", "image", "video"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2 py-1 text-xs flex items-center gap-1 transition-all ${
                typeFilter === type
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              {type === "image" && <ImageIcon className="h-3 w-3" />}
              {type === "video" && <Video className="h-3 w-3" />}
              <span>{type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}</span>
              {typeFilter === type && (
                <span className="w-1 h-1 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-4 bg-border/60" />

        {/* Tags - Scrollable Row */}
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
          <>{visibleItems.length} of {filteredAssets.length}{hasActiveFilters ? ` (${assets.length} total)` : ""}</>
        ) : (
          <>{filteredAssets.length}{hasActiveFilters ? ` / ${assets.length}` : ""} {filteredAssets.length === 1 ? "item" : "items"}</>
        )}
      </div>

      {/* Masonry Grid */}
      {filteredAssets.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No assets found matching your criteria.</p>
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
            {visibleItems.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                isMobile={isMobile}
                onClick={() => openViewer(asset.id)}
                skipLoadingAnimation={isBackNav}
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
              {!hasMore && filteredAssets.length > pageSize && (
                <span className="text-xs text-muted-foreground/50">
                  All {filteredAssets.length} items loaded
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Image Viewer */}
      {selectedAsset && (
        <ImageViewer
          asset={selectedAsset}
          assets={filteredAssets}
          onClose={closeViewer}
          onNavigate={navigateViewer}
        />
      )}
    </div>
  );
}

interface AssetCardProps {
  asset: GalleryAsset;
  isMobile: boolean;
  onClick: () => void;
  skipLoadingAnimation?: boolean;
}

// Memoized to prevent re-renders when lightbox state changes
const AssetCard = memo(function AssetCard({ asset, isMobile, onClick, skipLoadingAnimation }: AssetCardProps) {
  // Deterministic height ratio based on asset id for visual variety
  const heightRatio = 1.0 + ((asset.id * 7) % 9) / 10;
  const cardHeight = Math.round(heightRatio * (isMobile ? 150 : 250));

  return (
    <MasonryCard
      height={cardHeight}
      onClick={onClick}
      ariaLabel={asset.title || "View asset"}
    >
      <AssetCardContent asset={asset} skipLoadingAnimation={skipLoadingAnimation} />
    </MasonryCard>
  );
});

interface AssetCardContentProps {
  asset: GalleryAsset;
  skipLoadingAnimation?: boolean;
}

function AssetCardContent({ asset, skipLoadingAnimation }: AssetCardContentProps) {
  const { isHovered, onImageLoad } = useMasonryCardContext();
  // Skip loading animation on back navigation for instant display
  const [isLoaded, setIsLoaded] = useState(skipLoadingAnimation ?? false);

  const handleLoad = () => {
    setIsLoaded(true);
    if (asset.type === "image") {
      markImageCached(asset.url);
    }
    onImageLoad();
  };

  return (
    <>
      {asset.type === "video" ? (
        <video
          src={asset.url}
          className={`h-full w-full object-cover transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          } group-hover:scale-[1.03]`}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={handleLoad}
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
      ) : (
        <Image
          src={asset.url}
          alt={asset.altText || asset.title || "Gallery image"}
          fill
          sizes={imageSizes.masonry}
          quality={80}
          className={`object-cover transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          } group-hover:scale-[1.03]`}
          onLoad={handleLoad}
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {/* Subtle hover overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          isHovered ? "bg-white/5" : "bg-transparent"
        }`}
      />

      {/* Type indicator */}
      <div className="absolute top-2 right-2 p-1 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        {asset.type === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
      </div>

      {/* Info overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4">
        {asset.title && (
          <h3 className="text-xs font-semibold tracking-wide text-white md:text-sm drop-shadow-lg">
            {asset.title}
          </h3>
        )}
        {asset.projectTitle && asset.projectSlug && (
          <Link
            href={`/project/${asset.projectSlug}`}
            className="text-[10px] text-white/70 hover:text-white transition-colors md:text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {asset.projectTitle}
          </Link>
        )}
        {asset.tags && asset.tags.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {asset.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] backdrop-blur-sm">
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-white/50 text-[10px]">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
