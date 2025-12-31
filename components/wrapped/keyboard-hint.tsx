"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface KeyboardHintProps {
  currentSection: number;
  totalSections: number;
}

export function KeyboardHint({ currentSection, totalSections }: KeyboardHintProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [currentSection]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-border/30 bg-background/60 px-2.5 py-1 backdrop-blur-sm md:flex"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.6, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          whileHover={{ opacity: 1 }}
        >
          <div className="flex items-center gap-1">
            <kbd className="flex h-5 w-5 items-center justify-center rounded border border-border/50 bg-muted/50 font-mono text-[10px] text-muted-foreground">
              ↑
            </kbd>
            <kbd className="flex h-5 w-5 items-center justify-center rounded border border-border/50 bg-muted/50 font-mono text-[10px] text-muted-foreground">
              ↓
            </kbd>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/70">
            {currentSection + 1}/{totalSections}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

