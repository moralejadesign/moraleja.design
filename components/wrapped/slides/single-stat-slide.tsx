"use client";

import { motion } from "framer-motion";
import { MetricCounter } from "../metric-counter";

interface SingleStatSlideProps {
  title: string;
  subtitle?: string;
  value: number;
  label: string;
  suffix?: string;
  footnote?: string;
}

export function SingleStatSlide({
  title,
  subtitle,
  value,
  label,
  suffix,
  footnote,
}: SingleStatSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-light text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">{subtitle}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mx-auto"
      >
        <div className="group relative overflow-visible">
          <span className="corner-cross top-left" aria-hidden="true" />
          <span className="corner-cross bottom-right" aria-hidden="true" />
          <div className="card-border bg-card/30 px-8 py-6 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-5xl font-light tracking-tight text-foreground">
              <MetricCounter value={value} suffix={suffix} />
            </p>
          </div>
        </div>
      </motion.div>

      {footnote && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-6 text-center font-mono text-xs text-muted-foreground"
        >
          {footnote}
        </motion.p>
      )}
    </div>
  );
}

