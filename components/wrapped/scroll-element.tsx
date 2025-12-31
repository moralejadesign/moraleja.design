"use client";

import { useRef } from "react";
import { motion, useInView, type Variant } from "framer-motion";
import { cn } from "@/lib/utils";

type Direction = "left" | "right" | "up" | "down" | "none";

interface ScrollElementProps {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  viewport?: {
    amount?: number;
    margin?: string;
    once?: boolean;
  };
}

const directionVariants: Record<Direction, { hidden: Variant; visible: Variant }> = {
  left: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  up: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  none: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export function ScrollElement({
  children,
  className,
  direction = "up",
  delay = 0,
  viewport = { amount: 0.3, margin: "0px", once: true },
}: ScrollElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    amount: viewport.amount,
    margin: viewport.margin as `${number}px ${number}px ${number}px ${number}px`,
    once: viewport.once,
  });

  const variants = directionVariants[direction];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98],
        delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

