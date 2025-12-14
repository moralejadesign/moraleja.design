"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeSwitcher } from "./theme-switcher"
import { useHeaderStore } from "@/stores/header"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { projectTitle, projectThumbnail, showProjectTitle } = useHeaderStore()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const displayProjectTitle = projectTitle && showProjectTitle

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
