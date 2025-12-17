"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/projects";
import { getBlobUrl } from "@/lib/config";
import { useTransitionStore } from "@/stores/transition";
import { MasonryGrid, MasonryCard, useMasonryCardContext } from "@/components/masonry";
import { imageSizes } from "@/components/optimized-image";
import { useIsBackNavigation } from "@/hooks/use-navigation-type";

interface HomeGridProps {
  projects: Project[];
}

/**
 * Home page grid displaying project cards with click-to-navigate transitions.
 */
export function HomeGrid({ projects }: HomeGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const setClickedCard = useTransitionStore((state) => state.setClickedCard);
  const prefetchedRef = useRef<Set<string>>(new Set());
  const isBackNav = useIsBackNavigation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePrefetch = useCallback((slug: string) => {
    if (prefetchedRef.current.has(slug)) return;
    prefetchedRef.current.add(slug);
    router.prefetch(`/project/${slug}`);
  }, [router]);

  const handleProjectClick = (
    project: Project,
    rect: DOMRect,
    imageUrl: string
  ) => {
    setClickedCard({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      imageUrl,
      scrollOffset: window.scrollY,
    });
    router.push(`/project/${project.slug}`);
  };

  return (
    <div className="w-full px-3 py-8 md:px-8 md:py-12 lg:px-12">
      <MasonryGrid>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isMobile={isMobile}
            onNavigate={handleProjectClick}
            onPrefetch={handlePrefetch}
            skipLoadingAnimation={isBackNav}
          />
        ))}
      </MasonryGrid>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  isMobile: boolean;
  onNavigate: (project: Project, rect: DOMRect, imageUrl: string) => void;
  onPrefetch: (slug: string) => void;
  skipLoadingAnimation?: boolean;
}

function ProjectCard({ project, isMobile, onNavigate, onPrefetch, skipLoadingAnimation }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardHeight = Math.round(project.heightRatio * (isMobile ? 150 : 250));

  const handleClick = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const imageElement = cardRef.current.querySelector("img");
    const imageUrl = imageElement?.src || getBlobUrl(project.thumbnail) || "";
    onNavigate(project, rect, imageUrl);
  };

  const handleMouseEnter = () => {
    onPrefetch(project.slug);
  };

  return (
    <div ref={cardRef} onMouseEnter={handleMouseEnter}>
      <MasonryCard
        height={cardHeight}
        onClick={handleClick}
        ariaLabel={`View project: ${project.title}`}
      >
        <ProjectCardContent project={project} skipLoadingAnimation={skipLoadingAnimation} />
      </MasonryCard>
    </div>
  );
}

interface ProjectCardContentProps {
  project: Project;
  skipLoadingAnimation?: boolean;
}

function ProjectCardContent({ project, skipLoadingAnimation }: ProjectCardContentProps) {
  const { isHovered, onImageLoad } = useMasonryCardContext();
  // Skip loading state on back navigation for instant display
  const [isLoaded, setIsLoaded] = useState(skipLoadingAnimation ?? false);

  const handleLoad = () => {
    setIsLoaded(true);
    onImageLoad();
  };

  return (
    <>
      <Image
        src={getBlobUrl(project.thumbnail) || "/placeholder.svg"}
        alt={project.title}
        fill
        sizes={imageSizes.masonry}
        quality={85}
        priority={project.position <= 3}
        className={`object-cover transition-all duration-700 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        } group-hover:scale-[1.03]`}
        onLoad={handleLoad}
      />

      {/* Loading skeleton - hidden on back navigation */}
      {!isLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {/* Subtle hover overlay - brightness lift instead of darkening */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          isHovered ? "bg-white/5" : "bg-transparent"
        }`}
      />

      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 lg:p-6">
        <h2
          className={`text-xs font-semibold tracking-wide md:text-sm lg:text-base ${
            project.textContrast === "dark" ? "text-gray-900" : "text-white"
          }`}
        >
          {project.title}
        </h2>
      </div>
    </>
  );
}

