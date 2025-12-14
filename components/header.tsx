"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeSwitcher } from "./theme-switcher"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm transition-all duration-300 ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div
        className={`container mx-auto flex items-center justify-between px-4 transition-all duration-300 md:px-8 lg:px-12 ${
          isScrolled ? "h-14 md:h-16" : "h-16 md:h-20"
        }`}
      >
        <Link
          href="/"
          className={`transition-all duration-300 ${
            isScrolled ? "h-6 md:h-7" : "h-7 md:h-8"
          }`}
        >
          <img
            src="/brand_assets/MORALEJA_BRAND.svg"
            alt="Moraleja"
            className="h-full w-auto invert dark:invert-0"
          />
        </Link>

        <nav className="flex items-center gap-6 md:gap-8">
          <Link
            href="/work"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:text-base"
          >
            Work
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:text-base"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:text-base"
          >
            Contact
          </Link>
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  )
}
