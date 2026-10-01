"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { MobileMenuTrigger } from "./mobile-menu-trigger"
import { WithPathname } from "./with-pathname"
import { useHeaderStore } from "@/stores/header"
import { navLinks, isActiveLink } from "@/lib/site"

// The drawer library only loads once someone opens the menu
const loadMobileMenu = () => import("./mobile-menu").then((m) => m.MobileMenu)
const MobileMenu = dynamic(loadMobileMenu, { ssr: false })

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuRequested, setMobileMenuRequested] = useState(false)
  const [showNewBadge, setShowNewBadge] = useState(false)
  const { projectTitle, projectThumbnail, showProjectTitle } = useHeaderStore()

  useEffect(() => {
    const hasSeenShopBadge = localStorage.getItem("shop-badge-seen")
    if (!hasSeenShopBadge) {
      setShowNewBadge(true)
    }
  }, [])

  const handleShopClick = () => {
    if (showNewBadge) {
      localStorage.setItem("shop-badge-seen", "true")
      setShowNewBadge(false)
    }
  }

  const displayProjectTitle = projectTitle && showProjectTitle

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-[var(--header-height)] items-center border-b border-border bg-background px-[23px] md:px-[37px] lg:px-[46px]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 lg:grid lg:grid-cols-[0.375fr_1fr_0.375fr]">
          <div className="relative flex h-6 items-center">
            <Link
              href="/"
              className={`h-full transition-opacity duration-300 ${
                displayProjectTitle ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <img
                src="/brand_assets/MORALEJA_BRAND.svg"
                alt="Moraleja"
                className="h-full w-auto invert dark:invert-0"
              />
            </Link>

            {projectTitle && (
              <div
                className={`absolute left-0 flex items-center gap-2 transition-opacity duration-300 ${
                  displayProjectTitle ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {projectThumbnail && (
                  <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-sm">
                    <img src={projectThumbnail} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <span className="max-w-[160px] truncate text-sm font-normal text-foreground md:max-w-[260px]">
                  {projectTitle}
                </span>
              </div>
            )}
          </div>

          {/* Desktop navigation */}
          <nav className="hidden items-center justify-self-center lg:flex" aria-label="Primary">
            <WithPathname>
              {(pathname) =>
                navLinks.map((link) => {
                  const isActive = isActiveLink(pathname, link.href)
                  const isShop = link.href === "/shop"

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => isShop && handleShopClick()}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-secondary hover:text-brand-ink ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {link.label}
                      {isShop && showNewBadge && (
                        <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wider text-foreground">
                          New
                        </span>
                      )}
                    </Link>
                  )
                })
              }
            </WithPathname>
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <Link
              href="/contact"
              className="hidden rounded-md bg-foreground px-2.5 py-1.5 text-sm text-background transition-colors hover:bg-foreground/80 sm:block"
            >
              Get in touch
            </Link>
            <MobileMenuTrigger
              onClick={async () => {
                if (!mobileMenuRequested) {
                  // Mount closed first so the drawer animates open
                  await loadMobileMenu()
                  setMobileMenuRequested(true)
                  requestAnimationFrame(() => setMobileMenuOpen(true))
                } else {
                  setMobileMenuOpen(true)
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Mobile drawer menu */}
      {mobileMenuRequested && <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />}
    </>
  )
}
