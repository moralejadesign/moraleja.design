"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";
import type { Project } from "@/db/schema";

async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return <ProjectForm project={project} />;
}
