"use client";

import { useEffect, useState, useRef } from "react";

export type NavigationType = "navigate" | "reload" | "back_forward" | "prerender";

/**
 * Detects the type of navigation that led to the current page.
 * Returns "back_forward" for browser back/forward gestures.
 */
export function useNavigationType(): NavigationType {
  const [navType, setNavType] = useState<NavigationType>("navigate");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    // Modern Navigation API (Chrome 102+, Edge 102+)
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    
    if (navEntry?.type) {
      setNavType(navEntry.type as NavigationType);
      return;
    }

    // Fallback for older browsers
    if (typeof performance !== "undefined" && performance.navigation) {
      const type = performance.navigation.type;
      if (type === 2) {
        setNavType("back_forward");
      } else if (type === 1) {
        setNavType("reload");
      }
    }
  }, []);

  return navType;
}

/**
 * Returns true if the page was reached via back/forward navigation.
 * Useful for skipping entrance animations on back gesture.
 */
export function useIsBackNavigation(): boolean {
  return useNavigationType() === "back_forward";
}
