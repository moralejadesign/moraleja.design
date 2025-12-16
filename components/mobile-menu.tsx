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
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed right-0 top-0 bottom-0 z-50 flex w-[280px] flex-col bg-background outline-none"
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">Navigation menu</Drawer.Title>
          
          {/* Header with close button */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="text-sm font-medium text-muted-foreground">Menu</span>
            <button
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-1 flex-col gap-1 p-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/" && pathname.startsWith(link.href))
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => onOpenChange(false)}
                  className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors border-l-2 ${
                    isActive
                      ? "border-foreground bg-secondary text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer with theme switcher */}
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
      aria-label="Open menu"
    >
      <MenuIcon />
    </button>
  )
}
