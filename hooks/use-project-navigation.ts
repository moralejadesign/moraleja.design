"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/projects";
import { useTransitionStore } from "@/stores/transition";

/**
 * Shared click-to-navigate zoom transition behavior for project grids:
 * tracks mobile breakpoint, prefetches on hover, and captures the clicked
 * card's screen position for the ZoomTransition on the destination page.
 */
export function useProjectNavigation() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const setClickedCard = useTransitionStore((state) => state.setClickedCard);
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePrefetch = useCallback((slug: string) => {
    if (prefetchedRef.current.has(slug)) return;
    prefetchedRef.current.add(slug);
    router.prefetch(`/project/${slug}`);
  }, [router]);

  const handleProjectClick = useCallback(
    (project: Project, rect: DOMRect, imageUrl: string) => {
      setClickedCard({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        imageUrl,
        scrollOffset: window.scrollY,
      });
      router.push(`/project/${project.slug}`);
    },
    [router, setClickedCard]
  );

  return { isMobile, handlePrefetch, handleProjectClick };
}
