import { socialLinks, email } from "@/lib/site"

export function Socials({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-3 text-sm leading-none ${className}`}>
      <div className="flex flex-wrap gap-2">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-brand-ink"
          >
            {link.name}
          </a>
        ))}
      </div>
      <a href={`mailto:${email}`} className="text-foreground transition-colors hover:text-brand-ink">
        {email}
      </a>
    </div>
  )
}
