"use client";

import type { Project } from "@/lib/projects";
import { CaseCard } from "@/components/case-card";
import { useProjectNavigation } from "@/hooks/use-project-navigation";

interface HomeGridProps {
  projects: Project[];
}

/**
 * Single-column list of case-study cards with click-to-navigate transitions.
 */
export function HomeGrid({ projects }: HomeGridProps) {
  const { handlePrefetch, handleProjectClick } = useProjectNavigation();

  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      {projects.map((project, index) => (
        <CaseCard
          key={project.id}
          project={project}
          priority={index === 0}
          onNavigate={handleProjectClick}
          onPrefetch={handlePrefetch}
        />
      ))}
    </div>
  );
}
