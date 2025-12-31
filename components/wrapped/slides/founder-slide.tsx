"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface FounderSlideProps {
  name: string;
  role: string;
  image: string;
  quote: string;
}

export function FounderSlide({ name, role, image, quote }: FounderSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
      </div>

      {/* Decorative lines */}
      <div className="absolute left-6 top-20 bottom-20 w-px bg-border/20" />
      <div className="absolute right-6 top-20 bottom-20 w-px bg-border/20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Photo card with brand guides */}
        <div className="group relative overflow-visible mb-8">
          <span className="corner-cross top-left" aria-hidden="true" />
          <span className="corner-cross bottom-right" aria-hidden="true" />
          
          <div className="card-border relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            
            {/* Name overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-foreground text-lg font-medium">{name}</p>
              <p className="text-muted-foreground text-sm">{role}</p>
            </div>
          </div>
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          <div className="flex items-start gap-2">
            <span className="text-3xl text-muted-foreground/30 font-serif leading-none">"</span>
            <p className="text-base text-muted-foreground italic leading-relaxed pt-2">
              {quote}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-px w-8 bg-border" />
            <span className="font-mono text-xs text-muted-foreground/60">{name}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

