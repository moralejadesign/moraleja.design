"use client";

import type { Project } from "@/lib/projects";
import { MasonryGrid } from "@/components/masonry";
import { ProjectCard } from "@/components/project-card";
import { useProjectNavigation } from "@/hooks/use-project-navigation";

interface RelatedProjectsProps {
  projects: Project[];
}

export function RelatedProjects({ projects }: RelatedProjectsProps) {
  const { isMobile, handlePrefetch, handleProjectClick } = useProjectNavigation();

  if (projects.length === 0) return null;

  const cardHeight = Math.round(1.5 * (isMobile ? 150 : 250));

  return (
    <div className="w-full border-t border-border px-3 py-8 md:px-8 md:py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 text-xl font-semibold tracking-tight">Keep Exploring</h2>
        <MasonryGrid>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isMobile={isMobile}
              onNavigate={handleProjectClick}
              onPrefetch={handlePrefetch}
              height={cardHeight}
            />
          ))}
        </MasonryGrid>
      </div>
    </div>
  );
}
