"use client"

import { Suspense, type ReactNode } from "react"
import { usePathname } from "next/navigation"

type RenderWithPathname = (pathname: string | null) => ReactNode

function PathnameReader({ children }: { children: RenderWithPathname }) {
  return children(usePathname())
}

/**
 * Reads the pathname inside its own Suspense boundary so shared layouts stay in
 * the prerendered shell; the fallback renders with no active link.
 */
export function WithPathname({ children }: { children: RenderWithPathname }) {
  return (
    <Suspense fallback={children(null)}>
      <PathnameReader>{children}</PathnameReader>
    </Suspense>
  )
}
