"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, GripVertical } from "lucide-react";
import type { Project } from "@/db/schema";
import { useState, useRef } from "react";

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
}

async function reorderProjects(orderedIds: number[]): Promise<void> {
  const res = await fetch("/api/projects/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder projects");
}

export function ProjectsList() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const draggedIndex = useRef<number | null>(null);

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

  const reorderMutation = useMutation({
    mutationFn: reorderProjects,
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);
      
      // Optimistically reorder
      if (previousProjects) {
        const reordered = orderedIds
          .map((id) => previousProjects.find((p) => p.id === id))
          .filter(Boolean) as Project[];
        queryClient.setQueryData<Project[]>(["projects"], reordered);
      }
      
      return { previousProjects };
    },
    onError: (err, orderedIds, context) => {
      queryClient.setQueryData(["projects"], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, id: number, index: number) => {
    setDraggedId(id);
    draggedIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    draggedIndex.current = null;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!projects || draggedIndex.current === null || draggedIndex.current === targetIndex) {
      handleDragEnd();
      return;
    }

    const newOrder = [...projects];
    const [removed] = newOrder.splice(draggedIndex.current, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    const orderedIds = newOrder.map((p) => p.id);
    reorderMutation.mutate(orderedIds);
    
    handleDragEnd();
  };

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
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Drag to reorder • Changes save automatically
      </p>
      {projects.map((project, index) => (
        <div
          key={project.id}
          draggable
          onDragStart={(e) => handleDragStart(e, project.id, index)}
          onDragOver={(e) => handleDragOver(e, project.id)}
          onDragEnd={handleDragEnd}
          onDrop={(e) => handleDrop(e, index)}
          className={`flex items-center gap-3 p-4 border transition-all ${
            draggedId === project.id
              ? "opacity-50 border-foreground/30"
              : dragOverId === project.id
              ? "border-foreground bg-muted/50"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          {project.thumbnail && (
            <div className="w-14 h-14 overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{project.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              /{project.slug}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/project/${project.slug}`}
              target="_blank"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="View live"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/projects/${project.id}`}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
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
