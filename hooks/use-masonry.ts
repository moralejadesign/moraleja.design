"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Configuration for the masonry grid layout.
 * Using CSS Grid with grid-row-end: span for reliable, overlap-free layouts.
 */
export const MASONRY_CONFIG = {
  /** Base row height unit in pixels - smaller = finer control */
  rowHeight: 8,
  /** Gap between items in pixels */
  gap: 16,
  /** Gap on larger screens */
  gapMd: 24,
} as const;

/**
 * Calculate row span for a given desired height.
 */
export function calculateRowSpan(height: number, gap: number): number {
  const rowHeight = MASONRY_CONFIG.rowHeight;
  return Math.ceil((height + gap) / (rowHeight + gap));
}

/**
 * Calculate the exact height a row span provides.
 * This ensures cards fill their spans perfectly with no leftover space.
 */
export function calculateSpanHeight(rowSpan: number, gap: number): number {
  const rowHeight = MASONRY_CONFIG.rowHeight;
  // Total height = (rows * rowHeight) + ((rows - 1) * gap)
  return rowSpan * rowHeight + (rowSpan - 1) * gap;
}

/**
 * Snap a desired height to the nearest grid-aligned height.
 * Returns both the row span and the exact height to use.
 */
export function snapToGrid(desiredHeight: number, isMobile: boolean = false): { 
  rowSpan: number; 
  height: number;
} {
  const gap = isMobile ? MASONRY_CONFIG.gap : MASONRY_CONFIG.gapMd;
  const rowSpan = calculateRowSpan(desiredHeight, gap);
  const height = calculateSpanHeight(rowSpan, gap);
  return { rowSpan, height };
}

/**
 * Custom hook for creating masonry layouts using CSS Grid row spanning.
 * Each item calculates its own row span based on content height.
 */
export function useMasonry() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const hasInitializedRef = useRef(false);

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.children) as HTMLElement[];
    if (items.length === 0) return;

    const gap = window.innerWidth >= 768 ? MASONRY_CONFIG.gapMd : MASONRY_CONFIG.gap;

    items.forEach((item) => {
      const content = item.querySelector("[data-masonry-content]") as HTMLElement;
      if (!content) return;

      const desiredHeight = parseInt(content.dataset.masonryHeight || "0", 10);
      if (desiredHeight <= 0) return;

      const { rowSpan, height } = snapToGrid(desiredHeight, gap === MASONRY_CONFIG.gap);
      
      item.style.gridRowEnd = `span ${rowSpan}`;
      content.style.height = `${height}px`;
    });

    // Only set isReady on first initialization
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialTimeout = setTimeout(recalculate, 10);

    const resizeObserver = new ResizeObserver(() => {
      recalculate();
    });

    resizeObserver.observe(container);

    window.addEventListener("resize", recalculate);

    return () => {
      clearTimeout(initialTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", recalculate);
    };
  }, [recalculate]);

  return { containerRef, isReady, recalculate };
}
