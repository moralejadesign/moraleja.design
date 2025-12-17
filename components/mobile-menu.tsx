"use client"

import { Drawer } from "vaul"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeSwitcher } from "./theme-switcher"

const MenuIcon = () => (
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
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
  </svg>
)

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

const navLinks = [
  { href: "/", label: "Work" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

interface MobileMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const pathname = usePathname()

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
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/" && pathname.startsWith(link.href))
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => onOpenChange(false)}
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
                </Link>
              )
            })}
          </nav>

          {/* Footer with theme switcher */}
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/60 font-mono uppercase tracking-wider">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export function MobileMenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:hidden"
      aria-label="Open menu"
    >
      <MenuIcon />
    </button>
  )
}
