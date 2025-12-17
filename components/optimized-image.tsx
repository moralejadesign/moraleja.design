"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  quality?: number;
}

/**
 * Optimized image component using Next.js Image with:
 * - Automatic WebP/AVIF conversion
 * - Responsive sizing
 * - Lazy loading (unless priority)
 * - Blur-up placeholder effect
 * - Smooth fade-in transition
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  className,
  containerClassName,
  onLoad,
  quality = 85,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center",
          fill ? "absolute inset-0" : "",
          containerClassName
        )}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-xs text-muted-foreground">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Shimmer placeholder */}
      <div
        className={cn(
          "absolute inset-0 bg-muted transition-opacity duration-500",
          isLoaded ? "opacity-0" : "opacity-100 animate-pulse"
        )}
      />

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={quality}
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

/**
 * Simple sizes helper for common layouts
 */
export const imageSizes = {
  /** Full width on all screens */
  full: "100vw",
  /** Gallery grid: 2 cols mobile, 3 cols desktop */
  gallery: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  /** Card in masonry: 2 cols mobile, 3 cols large */
  masonry: "(max-width: 768px) 50vw, 33vw",
  /** Thumbnail */
  thumbnail: "128px",
  /** Hero image */
  hero: "(max-width: 768px) 100vw, 80vw",
} as const;
