"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, X, Image as ImageIcon, Video } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type Masonry from "masonry-layout";
import { PREDEFINED_TAGS, normalizeTag } from "@/lib/tags";
import { ImageViewer } from "@/components/image-viewer";
import { markImageCached } from "@/lib/image-cache";

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
}

export function GalleryGrid({ assets, availableTags }: GalleryGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  
  // Image viewer state from URL
  const viewingId = searchParams.get("photo");
  const selectedAsset = viewingId
    ? assets.find((a) => a.id === parseInt(viewingId, 10))
    : null;

  const openViewer = useCallback(
    (assetId: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("photo", assetId.toString());
      router.push(`/gallery?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const closeViewer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("photo");
    const queryString = params.toString();
    router.push(queryString ? `/gallery?${queryString}` : "/gallery", {
      scroll: false,
    });
  }, [router, searchParams]);

  const navigateViewer = useCallback(
    (assetId: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("photo", assetId.toString());
      router.replace(`/gallery?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Type filter
      if (typeFilter !== "all" && asset.type !== typeFilter) {
        return false;
      }

      // Tag filter (case-insensitive)
      if (selectedTags.length > 0) {
        const assetTags = (asset.tags || []).map(normalizeTag);
        const hasMatchingTag = selectedTags.some((tag) =>
          assetTags.includes(normalizeTag(tag))
        );
        if (!hasMatchingTag) return false;
      }

      // Search filter
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

      {/* Results Count - More subtle */}
      <div className="text-xs text-muted-foreground/60 font-mono">
        {filteredAssets.length}{hasActiveFilters ? ` / ${assets.length}` : ""} {filteredAssets.length === 1 ? "item" : "items"}
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
        <GalleryMasonryGrid assets={filteredAssets} onAssetClick={openViewer} />
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

interface GalleryMasonryGridProps {
  assets: GalleryAsset[];
  onAssetClick: (id: number) => void;
}

function GalleryMasonryGrid({ assets, onAssetClick }: GalleryMasonryGridProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const masonryRef = useRef<Masonry | null>(null);

  const relayout = useCallback(() => {
    if (masonryRef.current && typeof masonryRef.current.layout === "function") {
      masonryRef.current.layout();
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !sizerRef.current) return;

    let masonryInstance: Masonry | null = null;

    const getGutter = () => {
      if (typeof window === "undefined") return 16;
      return window.innerWidth >= 768 ? 24 : 16;
    };

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    const initMasonry = async () => {
      const MasonryModule = await import("masonry-layout");
      const MasonryClass = MasonryModule.default;

      const instance = new MasonryClass(containerRef.current!, {
        itemSelector: ".gallery-item",
        columnWidth: sizerRef.current,
        gutter: getGutter(),
        percentPosition: true,
        transitionDuration: 0,
      });

      masonryInstance = instance;
      masonryRef.current = instance;
      if (instance && typeof instance.layout === "function") {
        instance.layout();
      }

      checkMobile();
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    };

    initMasonry();

    const handleResize = () => {
      checkMobile();
      if (masonryRef.current) {
        (masonryRef.current as Masonry & { options: { gutter: number } }).options.gutter = getGutter();
        if (typeof masonryRef.current.layout === "function") {
          masonryRef.current.layout();
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (masonryInstance && typeof masonryInstance.destroy === "function") {
        masonryInstance.destroy();
      }
      masonryRef.current = null;
    };
  }, [assets]);

  useEffect(() => {
    relayout();
  }, [isMobile, relayout, assets]);

  return (
    <div
      ref={containerRef}
      className={`masonry-container transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`}
    >
      <div
        ref={sizerRef}
        className="gallery-sizer invisible absolute w-[calc(50%-8px)] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
      />
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          isMobile={isMobile}
          isHovered={hoveredId === asset.id}
          onHover={(hovered) => setHoveredId(hovered ? asset.id : null)}
          onImageLoad={relayout}
          onClick={() => onAssetClick(asset.id)}
        />
      ))}
    </div>
  );
}

function AnimatedNumber({ value, isVisible }: { value: number; isVisible: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setDisplayValue(0);
      return;
    }

    const duration = 400;
    const steps = 20;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  return <span>{displayValue}</span>;
}

interface AssetCardProps {
  asset: GalleryAsset;
  isMobile: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onImageLoad: () => void;
  onClick: () => void;
}

function AssetCard({ asset, isMobile, isHovered, onHover, onImageLoad, onClick }: AssetCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Random height ratio between 1.0 and 1.8 for variety, seeded by asset id
  const heightRatio = 1.0 + ((asset.id * 7) % 9) / 10;
  const cardHeight = Math.round(heightRatio * (isMobile ? 150 : 250));

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });
    }
  }, [isHovered]);

  const handleLoad = () => {
    setIsLoaded(true);
    // Mark image as cached so lightbox can use it instantly
    if (asset.type === "image") {
      markImageCached(asset.url);
    }
    onImageLoad();
  };

  return (
    <div
      ref={cardRef}
      className="gallery-item group relative mb-4 block w-[calc(50%-8px)] cursor-pointer overflow-visible transition-all duration-300 hover:scale-[1.02] md:mb-6 md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Corner crosses - Geist style */}
      <span className="corner-cross top-left" aria-hidden="true" />
      <span className="corner-cross bottom-right" aria-hidden="true" />

      {/* Dimension labels - Figma style */}
      <span
        className={`absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground/50 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        }`}
        aria-hidden="true"
      >
        <AnimatedNumber value={dimensions.width} isVisible={isHovered} />
      </span>
      <span
        className={`absolute -right-4 top-1/2 -translate-y-1/2 rotate-90 font-mono text-[10px] text-muted-foreground/50 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
        }`}
        aria-hidden="true"
      >
        <AnimatedNumber value={dimensions.height} isVisible={isHovered} />
      </span>

      <div className="card-border relative w-full overflow-hidden" style={{ height: `${cardHeight}px` }}>
        {asset.type === "video" ? (
          <video
            src={asset.url}
            className={`h-full w-full object-cover transition-all duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            } group-hover:scale-110`}
            muted
            loop
            playsInline
            onLoadedData={handleLoad}
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : (
          <img
            src={asset.url}
            alt={asset.altText || asset.title || "Gallery image"}
            className={`h-full w-full object-cover transition-all duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            } group-hover:scale-110`}
            onLoad={handleLoad}
          />
        )}

        {/* Loading skeleton */}
        {!isLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-black/0 transition-all duration-300 ${
            isHovered ? "bg-black/20" : ""
          }`}
        />

        {/* Type indicator */}
        <div className="absolute top-2 right-2 p-1 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {asset.type === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
        </div>
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
    </div>
  );
}

