"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { ThemeSwitcher } from "./theme-switcher"
import { useHeaderStore } from "@/stores/header"

const navLinks = [
  { href: "/", label: "Work" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

const ANIMATION_CONFIG = {
  backdrop: { duration: 0.2, ease: "easeOut" as const },
  menu: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const pathname = usePathname()
  const { projectTitle, projectThumbnail, showProjectTitle } = useHeaderStore()

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const closeMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMenu()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isMobileMenuOpen, closeMenu])

  useEffect(() => {
    if (isMobileMenuOpen) {
      const closeButton = document.querySelector('[aria-label="Close menu"]') as HTMLElement
      closeButton?.focus()
    }
  }, [isMobileMenuOpen])

  const isActive = useCallback((href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href)
  }, [pathname])

  const displayProjectTitle = projectTitle && showProjectTitle

  const headerHeight = isScrolled ? "h-14 md:h-16" : "h-16 md:h-20"
  const navPaddingTop = isScrolled ? "pt-14" : "pt-16"

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm transition-all duration-300 ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div
          className={`container mx-auto flex items-center justify-between px-4 transition-all duration-300 md:px-8 lg:px-12 ${headerHeight}`}
        >
          <div className="relative flex items-center">
            <Link
              href="/"
              className={`transition-all duration-300 ${
                displayProjectTitle ? "opacity-0 pointer-events-none" : "opacity-100"
              } ${isScrolled ? "h-6 md:h-7" : "h-7 md:h-8"}`}
            >
              <img
                src="/brand_assets/MORALEJA_BRAND.svg"
                alt="Moraleja"
                className="h-full w-auto invert dark:invert-0"
              />
            </Link>
            
            {projectTitle && (
              <div
                className={`absolute left-0 flex items-center gap-2 transition-all duration-300 ${
                  displayProjectTitle ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {projectThumbnail && (
                  <div className="h-6 w-6 md:h-7 md:w-7 overflow-hidden rounded-sm flex-shrink-0">
                    <img
                      src={projectThumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <span className="text-sm font-semibold text-foreground truncate max-w-[160px] md:max-w-[260px]">
                  {projectTitle}
                </span>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-6 md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-foreground md:text-base ${
                  isActive(link.href)
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <ThemeSwitcher />
          </nav>

          <div className="flex md:hidden items-center gap-4">
            <ThemeSwitcher />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground p-2 -mr-2 relative z-[70]"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : ANIMATION_CONFIG.backdrop}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={prefersReducedMotion ? { duration: 0 } : ANIMATION_CONFIG.menu}
              className="fixed top-0 right-0 bottom-0 w-64 bg-background border-l border-border z-[70] md:hidden"
            >
              <button
                onClick={closeMenu}
                className="absolute top-4 right-4 p-2 text-foreground hover:text-muted-foreground transition-colors z-10"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
              <nav className={`flex flex-col p-6 gap-6 ${navPaddingTop} transition-all duration-300`}>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`text-base font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
