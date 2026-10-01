"use client"

import { Drawer } from "vaul"
import Link from "next/link"
import { useState, useEffect } from "react"
import { navLinks, isActiveLink, socialLinks, email } from "@/lib/site"
import { WithPathname } from "./with-pathname"

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)


interface MobileMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const [showNewBadge, setShowNewBadge] = useState(false)

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
    onOpenChange(false)
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]" />
        <Drawer.Content
          className="fixed right-0 top-0 bottom-0 z-50 flex w-[260px] flex-col bg-background border-l border-border outline-none"
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">Navigation menu</Drawer.Title>
          
          {/* Header with close button */}
          <div className="flex h-16 items-center justify-end px-4">
            <button
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-1 flex-col px-6 py-4">
            <WithPathname>
              {(pathname) =>
                navLinks.map((link) => {
                  const isActive = isActiveLink(pathname, link.href)
                  const isShop = link.href === "/shop"
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => isShop ? handleShopClick() : onOpenChange(false)}
                      className={`group relative flex items-center py-3 text-sm font-medium tracking-wide transition-colors ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-1 rounded-full bg-brand-accent" />
                      )}
                      {link.label}
                      {isShop && showNewBadge && (
                        <span className="ml-2 rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wider text-foreground">
                          New
                        </span>
                      )}
                    </Link>
                  )
                })
              }
            </WithPathname>
          </nav>

          {/* Footer with theme switcher */}
          <div className="flex flex-col gap-2 border-t border-border px-6 py-6 text-sm">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
              {socialLinks.map((link) => (
                <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brand-ink">
                  {link.name}
                </a>
              ))}
            </div>
            <a href={`mailto:${email}`} className="text-foreground">{email}</a>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
