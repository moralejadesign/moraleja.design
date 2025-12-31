"use client";

import { motion } from "framer-motion";

interface IndustriesSlideProps {
  industries: string[];
}

export function IndustriesSlide({ industries }: IndustriesSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-light text-foreground">Industries served</h2>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Diverse sectors, unique stories
        </p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-2">
        {industries.map((industry, index) => (
          <motion.span
            key={industry}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
            className="px-4 py-2 text-sm font-medium border border-border/60 text-muted-foreground"
          >
            {industry}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

