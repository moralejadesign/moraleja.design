"use client";

import { motion } from "framer-motion";

interface IntroSlideProps {
  studioName: string;
  description: string;
  year: number;
}

export function IntroSlide({ studioName, description, year }: IntroSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col px-6 pt-16 pb-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Decorative lines - left */}
      <div className="absolute left-4 top-20 bottom-20 w-px bg-border/30" />
      <div className="absolute left-4 top-1/4 w-6 h-px bg-border/30" />
      <div className="absolute left-4 top-1/2 w-4 h-px bg-border/30" />
      <div className="absolute left-4 top-3/4 w-6 h-px bg-border/30" />

      {/* Decorative lines - right */}
      <div className="absolute right-4 top-20 bottom-20 w-px bg-border/30" />
      <div className="absolute right-4 top-1/4 w-6 h-px bg-border/30 -translate-x-full" />
      <div className="absolute right-4 top-1/2 w-4 h-px bg-border/30 -translate-x-full" />
      <div className="absolute right-4 top-3/4 w-6 h-px bg-border/30 -translate-x-full" />

      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-full bg-brand-accent/10 blur-2xl" />
          <img
            src="/brand_assets/MORALEJA_BRAND.svg"
            alt="Moraleja"
            className="relative h-16 w-auto invert dark:invert-0"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-6 text-center text-xl font-medium tracking-tight text-foreground"
        >
          {studioName}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 max-w-xs text-center text-sm text-muted-foreground"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-10 flex flex-col items-center"
        >
          <span className="text-8xl font-extralight tracking-tighter text-foreground">
            {year}
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-px w-8 bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Wrapped
            </span>
            <span className="h-px w-8 bg-border" />
          </div>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="text-center font-mono text-xs text-muted-foreground/50"
      >
        Tap to continue
      </motion.p>
    </div>
  );
}
