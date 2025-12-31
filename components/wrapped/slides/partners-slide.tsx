"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Partner {
  slug: string;
  title: string;
  thumbnail: string;
}

interface PartnersSlideProps {
  projects: Partner[];
}

export function PartnersSlide({ projects }: PartnersSlideProps) {
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
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-light text-foreground">Trusted by</h2>
      </motion.div>

      <div className="grid w-full grid-cols-2 gap-3">
        {projects.slice(0, 6).map((project, index) => (
          <motion.div
            key={project.slug}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
            className="group relative overflow-visible"
          >
            <span className="corner-cross top-left" aria-hidden="true" />
            <span className="corner-cross bottom-right" aria-hidden="true" />
            <div className="card-border bg-card/20 aspect-[4/3] overflow-hidden">
              <Image
                src={project.thumbnail}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 200px"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
