"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions<T> {
  /** All items to paginate through */
  items: T[];
  /** Number of items per page */
  pageSize?: number;
  /** Distance from bottom (in px) to trigger loading more */
  threshold?: number;
  /** Whether infinite scroll is enabled */
  enabled?: boolean;
}

interface UseInfiniteScrollResult<T> {
  /** Currently visible items */
  visibleItems: T[];
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether currently loading more items */
  isLoading: boolean;
  /** Ref to attach to the scroll sentinel element */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** Manually load more items */
  loadMore: () => void;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Hook for client-side infinite scroll pagination.
 * Progressively reveals items as user scrolls down.
 */
export function useInfiniteScroll<T>({
  items,
  pageSize = 20,
  threshold = 200,
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const visibleItems = enabled ? items.slice(0, visibleCount) : items;
  const hasMore = enabled && visibleCount < items.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    // Small delay for smoother UX
    requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
      setIsLoading(false);
    });
  }, [hasMore, isLoading, pageSize, items.length]);

  const reset = useCallback(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  // Reset when items change (e.g., filter applied)
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  // Setup Intersection Observer for scroll detection
  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [enabled, hasMore, isLoading, loadMore, threshold]);

  return {
    visibleItems,
    hasMore,
    isLoading,
    sentinelRef,
    loadMore,
    reset,
  };
}
