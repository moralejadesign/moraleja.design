"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentIndex: number;
  totalSlides: number;
  className?: string;
  onIndicatorClick?: (index: number) => void;
}

export function ProgressIndicator({
  currentIndex,
  totalSlides,
  className,
  onIndicatorClick,
}: ProgressIndicatorProps) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {Array.from({ length: totalSlides }).map((_, index) => {
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onIndicatorClick?.(index)}
            className={cn(
              "h-1 flex-1 max-w-8 rounded-full overflow-hidden transition-all",
              "bg-foreground/20 hover:bg-foreground/30"
            )}
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              className={cn(
                "h-full bg-brand-accent transition-all duration-300",
                isPast && "w-full",
                isActive && "w-full",
                !isPast && !isActive && "w-0"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

