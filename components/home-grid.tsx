"use client";

import type { Project } from "@/lib/projects";
import { MasonryGrid } from "@/components/masonry";
import { ProjectCard } from "@/components/project-card";
import { useIsBackNavigation } from "@/hooks/use-navigation-type";
import { useProjectNavigation } from "@/hooks/use-project-navigation";

interface HomeGridProps {
  projects: Project[];
}

/**
 * Home page grid displaying project cards with click-to-navigate transitions.
 */
export function HomeGrid({ projects }: HomeGridProps) {
  const { isMobile, handlePrefetch, handleProjectClick } = useProjectNavigation();
  const isBackNav = useIsBackNavigation();

  return (
    <div className="w-full px-3 py-8 md:px-8 md:py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
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
    </div>
  );
}

