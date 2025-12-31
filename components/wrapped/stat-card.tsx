"use client";

import { cn } from "@/lib/utils";
import { MetricCounter } from "./metric-counter";

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  className?: string;
}

export function StatCard({ label, value, suffix, className }: StatCardProps) {
  const isNumber = typeof value === "number";

  return (
    <div
      className={cn(
        "group relative overflow-hidden border border-border/50 bg-card/30 p-6 transition-all hover:border-border",
        className
      )}
    >
      {/* Corner crosses - Moraleja style */}
      <span className="corner-cross top-left" aria-hidden="true" />
      <span className="corner-cross bottom-right" aria-hidden="true" />

      <div className="relative z-10">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-4xl font-light tracking-tight text-foreground md:text-5xl">
          {isNumber ? (
            <MetricCounter value={value} suffix={suffix} />
          ) : (
            <>
              {value}
              {suffix && (
                <span className="ml-1 text-lg text-muted-foreground">{suffix}</span>
              )}
            </>
          )}
        </p>
      </div>
      
      {/* Hover gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-accent/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

