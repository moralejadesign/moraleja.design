"use client";

import { motion } from "framer-motion";
import { MetricCounter } from "../metric-counter";

interface StatItem {
  label: string;
  value: number;
}

interface StatsSlideProps {
  title: string;
  subtitle?: string;
  stats: StatItem[];
}

export function StatsSlide({ title, subtitle, stats }: StatsSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
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

      <div className="grid w-full grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
            className="group relative overflow-visible"
          >
            <span className="corner-cross top-left" aria-hidden="true" />
            <span className="corner-cross bottom-right" aria-hidden="true" />
            <div className="card-border bg-card/30 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-light tracking-tight text-foreground">
                <MetricCounter value={stat.value} />
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

