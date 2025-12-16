import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-semibold tracking-tight">
              Moraleja Admin
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin/projects"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/admin/assets"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Assets
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View Site
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 md:px-8 lg:px-12 py-8">{children}</main>
    </div>
  );
}
