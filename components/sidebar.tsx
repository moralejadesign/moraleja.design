"use client"

import Link from "next/link"
import Image from "next/image"
import { sidebarLinks, isActiveLink } from "@/lib/site"
import { Socials } from "./socials"
import { WithPathname } from "./with-pathname"

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-full max-w-[288px] flex-col justify-between gap-5 self-start pt-[calc(var(--header-height)+64px)] pb-[46px] lg:flex">
      <nav className="flex flex-col" aria-label="Sections">
        <WithPathname>
          {(pathname) =>
            sidebarLinks.map((link) => {
              const isActive = isActiveLink(pathname, link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 self-start rounded px-2 py-1 text-sm transition-colors ${
                    link.accent
                      ? "text-foreground hover:bg-brand-accent hover:text-black"
                      : "hover:bg-secondary hover:text-brand-ink"
                  } ${isActive ? "text-foreground" : link.accent ? "" : "text-muted-foreground"}`}
                >
                  {isActive && <span className="h-1 w-1 rounded-full bg-brand-accent" />}
                  {link.label}
                </Link>
              )
            })
          }
        </WithPathname>
      </nav>

      <div className="flex flex-col gap-6">
        <div className="group relative">
          <span className="corner-cross top-left" aria-hidden="true" />
          <span className="corner-cross bottom-right" aria-hidden="true" />
          <Link
            href="/contact"
            className="card-border relative flex h-[236px] items-end justify-between overflow-hidden rounded-lg bg-card p-6 text-sm"
          >
            <Image
              src="/brand_assets/MORALEJA_OG.jpg"
              alt=""
              fill
              sizes="288px"
              className="object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-40 dark:opacity-60"
            />
            <span className="relative rounded-sm bg-background px-2 py-1 transition-colors group-hover:bg-brand-accent group-hover:text-black">
              Get in touch
            </span>
            <span className="relative rounded-sm bg-background px-2 py-1 transition-all group-hover:translate-x-1 group-hover:bg-brand-accent group-hover:text-black" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
        <hr className="border-border" />
        <Socials />
      </div>
    </aside>
  )
}
