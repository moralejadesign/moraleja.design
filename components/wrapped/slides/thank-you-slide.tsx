"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface ThankYouSlideProps {
  contactUrl: string;
  instagramUrl: string;
  generatedAt: string;
}

export function ThankYouSlide({
  contactUrl,
  instagramUrl,
  generatedAt,
}: ThankYouSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-accent/10 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <p className="text-4xl font-light text-foreground">Thank you</p>
        <p className="mt-4 text-muted-foreground">
          for being part of our creative journey
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <Link
          href={contactUrl}
          className="w-full max-w-xs rounded-full border border-border px-6 py-3 text-center text-sm text-foreground transition-colors hover:bg-muted hover:border-brand-accent/50"
        >
          Work with us
        </Link>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-xs rounded-full border border-border px-6 py-3 text-center text-sm text-foreground transition-colors hover:bg-muted hover:border-brand-accent/50"
        >
          Follow on Instagram
        </a>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-8 text-center font-mono text-xs text-muted-foreground/60"
      >
        Generated on{" "}
        {new Date(generatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </motion.p>
    </div>
  );
}

