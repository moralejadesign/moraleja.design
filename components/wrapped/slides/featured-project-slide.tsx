"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { getBlobUrl } from "@/lib/config";

interface FeaturedProjectSlideProps {
  project: {
    slug: string;
    title: string;
    thumbnail: string;
  };
}

export function FeaturedProjectSlide({ project }: FeaturedProjectSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col justify-center px-6 pt-16 pb-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl font-light text-foreground">Featured project</h2>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          A highlight from our portfolio
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Link
          href={`/project/${project.slug}`}
          className="group relative block overflow-visible"
        >
          <span className="corner-cross top-left" aria-hidden="true" />
          <span className="corner-cross bottom-right" aria-hidden="true" />
          <div className="card-border relative aspect-video overflow-hidden">
            <Image
              src={getBlobUrl(project.thumbnail) || ""}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-lg font-semibold text-white">{project.title}</p>
            </div>
          </div>
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-4 text-center font-mono text-xs text-muted-foreground/60"
      >
        Tap to view project
      </motion.p>
    </div>
  );
}

