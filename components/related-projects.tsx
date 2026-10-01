"use client";

import type { Project } from "@/lib/projects";
import { CaseCard } from "@/components/case-card";
import { SectionTitle } from "@/components/page-intro";
import { useProjectNavigation } from "@/hooks/use-project-navigation";

interface RelatedProjectsProps {
  projects: Project[];
}

export function RelatedProjects({ projects }: RelatedProjectsProps) {
  const { handlePrefetch, handleProjectClick } = useProjectNavigation();

  if (projects.length === 0) return null;

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-8">
      <SectionTitle>keep exploring:</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        {projects.map((project) => (
          <CaseCard
            key={project.id}
            project={project}
            compact
            onNavigate={handleProjectClick}
            onPrefetch={handlePrefetch}
          />
        ))}
      </div>
    </section>
  );
}
