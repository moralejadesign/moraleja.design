"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import type { Project } from "@/db/schema";
import { useState } from "react";

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
}

export function ProjectsList() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onMutate: async (id) => {
      setDeletingId(id);
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);
      queryClient.setQueryData<Project[]>(["projects"], (old) =>
        old?.filter((p) => p.id !== id)
      );
      return { previousProjects };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["projects"], context?.previousProjects);
    },
    onSettled: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-muted/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load projects. Please try again.
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No projects yet</p>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create your first project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-colors"
        >
          {project.thumbnail && (
            <div className="w-16 h-16 overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{project.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              /{project.slug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/project/${project.slug}`}
              target="_blank"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="View live"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/projects/${project.id}`}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this project?")) {
                  deleteMutation.mutate(project.id);
                }
              }}
              disabled={deletingId === project.id}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
