"use client";

import { useState, useEffect, useRef, type ReactNode, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { useMasonryContext } from "./masonry-grid";

interface MasonryCardProps {
  height: number;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Card component for masonry grid.
 * Uses data-masonry-content attribute for accurate height measurement.
 */
export function MasonryCard({
  height,
  children,
  onClick,
  className,
  ariaLabel,
}: MasonryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { onImageLoad } = useMasonryContext();

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
  }, [isHovered]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative cursor-pointer overflow-visible",
        "transition-transform duration-500 ease-out",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {/* Corner crosses - Geist style */}
      <span className="corner-cross top-left" aria-hidden="true" />
      <span className="corner-cross bottom-right" aria-hidden="true" />

      {/* Dimension labels - Figma style */}
      <DimensionLabel
        value={dimensions.width}
        isVisible={isHovered}
        position="top"
      />
      <DimensionLabel
        value={dimensions.height}
        isVisible={isHovered}
        position="right"
      />

      {/* Card content with border - height snapped to grid by useMasonry hook */}
      <div
        data-masonry-content
        data-masonry-height={height}
        className="card-border relative w-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <MasonryCardContext.Provider value={{ isHovered, onImageLoad }}>
          {children}
        </MasonryCardContext.Provider>
      </div>
    </div>
  );
}

interface MasonryCardContextValue {
  isHovered: boolean;
  onImageLoad: () => void;
}

const MasonryCardContext = createContext<MasonryCardContextValue>({
  isHovered: false,
  onImageLoad: () => {},
});

export function useMasonryCardContext() {
  return useContext(MasonryCardContext);
}

interface DimensionLabelProps {
  value: number;
  isVisible: boolean;
  position: "top" | "right";
}

function DimensionLabel({ value, isVisible, position }: DimensionLabelProps) {
  const positionClasses =
    position === "top"
      ? "absolute -top-5 left-1/2 -translate-x-1/2"
      : "absolute -right-4 top-1/2 -translate-y-1/2 rotate-90";

  const animationClasses =
    position === "top"
      ? isVisible
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-1"
      : isVisible
        ? "opacity-100 translate-x-0"
        : "opacity-0 -translate-x-1";

  return (
    <span
      className={cn(
        positionClasses,
        "font-mono text-[10px] text-muted-foreground/50 transition-all duration-300",
        animationClasses
      )}
      aria-hidden="true"
    >
      <AnimatedNumber value={value} isVisible={isVisible} />
    </span>
  );
}

interface AnimatedNumberProps {
  value: number;
  isVisible: boolean;
}

function AnimatedNumber({ value, isVisible }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setDisplayValue(0);
      return;
    }

    const duration = 400;
    const steps = 20;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  return <span>{displayValue}</span>;
}
