"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Tool {
  name: string;
  icon: string;
}

interface ToolsSlideProps {
  tools: Tool[];
}

export function ToolsSlide({ tools }: ToolsSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
      </div>

      {/* Decorative lines */}
      <div className="absolute left-6 top-20 bottom-20 w-px bg-border/20" />
      <div className="absolute right-6 top-20 bottom-20 w-px bg-border/20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl font-light text-foreground">Some of our fav tools</h2>
      </motion.div>

      <div className="flex w-full flex-col gap-3">
        {/* First row */}
        <div className="grid grid-cols-3 gap-3">
          {tools.slice(0, 3).map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
              className="group relative overflow-visible"
            >
              <span className="corner-cross top-left" aria-hidden="true" />
              <span className="corner-cross bottom-right" aria-hidden="true" />
              <div className="card-border bg-card/20 p-6 flex items-center justify-center aspect-square">
                <div className="relative h-14 w-14">
                  <Image
                    src={tool.icon}
                    alt={tool.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Second row - centered */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-3 w-full">
            {tools.slice(3).map((tool, index) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                className="group relative overflow-visible"
              >
                <span className="corner-cross top-left" aria-hidden="true" />
                <span className="corner-cross bottom-right" aria-hidden="true" />
                <div className="card-border bg-card/20 p-6 flex items-center justify-center aspect-square">
                  <div className="relative h-14 w-14">
                    <Image
                      src={tool.icon}
                      alt={tool.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

