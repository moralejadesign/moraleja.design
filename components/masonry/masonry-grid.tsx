"use client";

import { useEffect, useCallback, useState, useRef, type ReactNode, createContext, useContext } from "react";
import { useMasonry, MASONRY_CONFIG } from "@/hooks/use-masonry";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container component for masonry layouts.
 * Uses CSS Grid with grid-auto-rows for native masonry behavior.
 * Each child calculates its own row span for consistent, overlap-free spacing.
 */
export function MasonryGrid({ children, className }: MasonryGridProps) {
  const { containerRef, isReady, recalculate } = useMasonry();
  const [gap, setGap] = useState<number>(MASONRY_CONFIG.gap);
  const childCountRef = useRef(0);

  const handleImageLoad = useCallback(() => {
    recalculate();
  }, [recalculate]);

  // Update gap on resize for responsive behavior
  useEffect(() => {
    const updateGap = () => {
      setGap(window.innerWidth >= 768 ? MASONRY_CONFIG.gapMd : MASONRY_CONFIG.gap);
    };
    updateGap();
    window.addEventListener("resize", updateGap);
    return () => window.removeEventListener("resize", updateGap);
  }, []);

  // Only recalculate when child count actually changes (not on every render)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const currentCount = container.children.length;
    if (currentCount !== childCountRef.current) {
      childCountRef.current = currentCount;
      recalculate();
    }
  });

  // Recalculate when gap changes (responsive breakpoint)
  useEffect(() => {
    recalculate();
  }, [gap, recalculate]);

  return (
    <MasonryContext.Provider value={{ onImageLoad: handleImageLoad }}>
      <div
        ref={containerRef}
        className={cn(
          "grid grid-cols-2 lg:grid-cols-3 items-start",
          "transition-opacity duration-300",
          isReady ? "opacity-100" : "opacity-0",
          className
        )}
        style={{
          gridAutoRows: `${MASONRY_CONFIG.rowHeight}px`,
          gap: `${gap}px`,
        }}
      >
        {children}
      </div>
    </MasonryContext.Provider>
  );
}

interface MasonryContextValue {
  onImageLoad: () => void;
}

const MasonryContext = createContext<MasonryContextValue>({
  onImageLoad: () => {},
});

export function useMasonryContext() {
  return useContext(MasonryContext);
}
