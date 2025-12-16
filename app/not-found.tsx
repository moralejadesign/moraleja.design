import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20 flex items-center justify-center">
        <div className="w-full px-4 py-12 md:px-8 md:py-20 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            {/* 404 Display */}
            <div className="relative inline-block mb-8">
              {/* Corner crosses */}
              <span className="corner-cross top-left" aria-hidden="true" />
              <span className="corner-cross bottom-right" aria-hidden="true" />
              
              {/* Decorative lines */}
              <div className="absolute -left-12 top-1/2 w-8 h-px bg-border/60 hidden md:block" />
              <div className="absolute -right-12 top-1/2 w-8 h-px bg-border/60 hidden md:block" />
              
              <div className="card-border px-12 py-8 md:px-16 md:py-10">
                <p className="font-mono text-[80px] md:text-[120px] lg:text-[150px] font-bold leading-none tracking-tighter text-foreground/10">
                  404
                </p>
              </div>
              
              {/* Dimension labels */}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground/40">
                page_not_found
              </span>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground/40">
                error.tsx
              </span>
            </div>

            {/* Message */}
            <div className="space-y-4 mb-10">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Oops, this page
                <br />
                <span className="text-muted-foreground">wandered off</span>
              </h1>
              
              <p className="text-muted-foreground max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved. 
                Let's get you back on track.
              </p>
            </div>

            {/* Navigation Options */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors"
              >
                <Home className="h-4 w-4" />
                Back to Work
              </Link>
              
              <Link
                href="/gallery"
                className="group inline-flex items-center gap-2 px-6 py-3 border border-border font-medium text-sm hover:bg-muted transition-colors"
              >
                Browse Gallery
              </Link>
            </div>

            {/* Fun Stats */}
            <div className="mt-16 pt-8 border-t border-border/40">
              <div className="flex items-center justify-center gap-8 md:gap-12">
                <div className="text-center">
                  <p className="font-mono text-2xl md:text-3xl font-bold text-foreground/20">∞</p>
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">possibilities</p>
                </div>
                <div className="h-8 w-px bg-border/40" />
                <div className="text-center">
                  <p className="font-mono text-2xl md:text-3xl font-bold text-foreground/20">1</p>
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">wrong turn</p>
                </div>
                <div className="h-8 w-px bg-border/40" />
                <div className="text-center">
                  <p className="font-mono text-2xl md:text-3xl font-bold text-foreground/20">0</p>
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">worries</p>
                </div>
              </div>
            </div>

            {/* Coordinates */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-border/30" />
              <span className="font-mono text-[10px] text-muted-foreground/30">
                coordinates: lost / somewhere / nice
              </span>
              <span className="h-px w-8 bg-border/30" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
