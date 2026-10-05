export type NavLink = { href: string; label: string; isNew?: boolean; accent?: boolean }

export const navLinks: NavLink[] = [
  { href: "/", label: "Work" },
  { href: "/gallery", label: "Gallery" },
  { href: "/lab", label: "Lab" },
  { href: "/shop", label: "Shop", isNew: true },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export const sidebarLinks: NavLink[] = [
  { href: "/", label: "Work" },
  { href: "/gallery", label: "Gallery" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/2025", label: "2025 Wrapped", accent: true },
]

export const socialLinks = [
  { name: "X", href: "https://x.com/moraleja_design", handle: "@moraleja_design" },
  { name: "Instagram", href: "https://www.instagram.com/alejandramoralesgarzon_/", handle: "@alejandramoralesgarzon_" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/alejamorales/", handle: "alejamorales" },
  { name: "GitHub", href: "https://github.com/moralejadesign", handle: "moralejadesign" },
]

export const email = "hello@moraleja.co"

/** Home page reel: carousel of project visuals. */
export const showreel = "/moraleja-projects-carousel.mp4"

export function isActiveLink(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || (href !== "/" && pathname.startsWith(href)) || (href === "/" && pathname.startsWith("/project/"))
}
