"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import { getBlobUrl } from "@/lib/config";

/** Picks dark or light text for a custom card background (#rgb or #rrggbb). */
function isLightColor(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  if ([r, g, b].some(Number.isNaN)) return false;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

function projectTag(project: Project) {
  return project.category || project.tools?.join(", ") || "";
}

interface CaseCardProps {
  project: Project;
  compact?: boolean;
  priority?: boolean;
  onNavigate: (project: Project, rect: DOMRect, imageUrl: string) => void;
  onPrefetch: (slug: string) => void;
}

export function CaseCard({ project, compact, priority, onNavigate, onPrefetch }: CaseCardProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const imageUrl = getBlobUrl(project.thumbnail);
  const tag = projectTag(project);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new-tab and modified clicks
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 || !mediaRef.current) return;
    event.preventDefault();
    onNavigate(project, mediaRef.current.getBoundingClientRect(), mediaRef.current.querySelector("img")?.src || imageUrl);
  };

  const colors = project.background
    ? { backgroundColor: project.background, color: isLightColor(project.background) ? "#0a0a0a" : "#fafafa" }
    : undefined;

  return (
    <div className="group relative">
      <span className="corner-cross top-left" aria-hidden="true" />
      <span className="corner-cross bottom-right" aria-hidden="true" />
      <Link
        href={`/project/${project.slug}`}
        onClick={handleClick}
        onMouseEnter={() => onPrefetch(project.slug)}
        style={colors}
        className={`card-border flex flex-col rounded-lg transition-shadow duration-200 hover:shadow-[inset_-2px_-5px_20px_9px_rgb(0_0_0/0.12)] ${
          colors ? "" : "bg-card text-card-foreground"
        } ${compact ? "h-full gap-3 p-2 sm:p-3" : "gap-4 p-2 sm:p-4"}`}
      >
        <div
          ref={mediaRef}
          className={`relative overflow-hidden rounded-lg ${compact ? "aspect-[4/3]" : ""}`}
        >
          {compact ? (
            <Image
              src={imageUrl}
              alt={project.title}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              quality={85}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <Image
              src={imageUrl}
              alt={project.title}
              width={1920}
              height={1080}
              sizes="(max-width: 1024px) 100vw, 960px"
              quality={85}
              priority={priority}
              className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3
            className={
              compact
                ? "text-lg font-normal leading-tight tracking-[-0.4px] md:text-xl"
                : "text-xl font-normal leading-[1.1] tracking-[-0.4px] md:text-2xl"
            }
          >
            {compact ? project.title : project.tagline || project.title}
          </h3>
          {tag && <p className="text-sm tracking-[0.14px] opacity-70">{tag}</p>}
        </div>
      </Link>
    </div>
  );
}
