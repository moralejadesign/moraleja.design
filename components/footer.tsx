import { cacheLife } from "next/cache"
import { Socials } from "./socials"

async function CopyrightYear() {
  "use cache"
  cacheLife("days")
  return <>{new Date().getFullYear()}</>
}

/** Below the sidebar breakpoint, the socials move to the end of the content column. */
export function Footer() {
  return (
    <footer className="flex flex-col gap-4 border-t border-border pt-6 lg:hidden">
      <Socials />
      <p className="text-sm text-muted-foreground">&copy; <CopyrightYear /> Moraleja</p>
    </footer>
  )
}
