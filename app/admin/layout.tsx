import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { QueryProvider } from "@/providers/query";
import type { Metadata } from "next";
import Link from "next/link";

// Admin is per-user and always rendered at request time
export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <div className="min-h-screen bg-background">
          <header className="print:hidden sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                  <Link
                    href="/admin/budgets"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Budgets
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
          <main className="container mx-auto px-4 md:px-8 lg:px-12 py-8 print:p-0 print:max-w-none">{children}</main>
        </div>
      </QueryProvider>
    </ClerkProvider>
  );
}
