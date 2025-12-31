"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function WrappedCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mx-auto max-w-7xl px-3 pt-8 md:px-8 md:pt-12 lg:px-12"
    >
      <Link
        href="/2025"
        className="group relative block overflow-visible"
      >
        <span className="corner-cross top-left" aria-hidden="true" />
        <span className="corner-cross bottom-right" aria-hidden="true" />
        <div className="card-border bg-card/30 p-4 transition-all hover:bg-card/40 md:p-6">
          <div className="flex flex-col items-center gap-2 text-center md:flex-row md:justify-between md:gap-4">
            <div>
              <h3 className="text-sm font-medium text-foreground md:text-base">
                Moraleja Design Wrapped 2025
              </h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Explore our year in review
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
              <span>View</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

