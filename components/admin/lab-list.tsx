"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, GripVertical, Eye, EyeOff } from "lucide-react";
import type { LabProject } from "@/db/schema";
import { useState, useRef } from "react";

async function fetchLabProjects(): Promise<LabProject[]> {
  const res = await fetch("/api/lab?includeUnpublished=true");
  if (!res.ok) throw new Error("Failed to fetch lab projects");
  return res.json();
}

async function deleteLabProject(id: number): Promise<void> {
  const res = await fetch(`/api/lab/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete lab project");
}

async function reorderLabProjects(orderedIds: number[]): Promise<void> {
  const res = await fetch("/api/lab/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder lab projects");
}

async function togglePublished(id: number, isPublished: boolean): Promise<void> {
  const res = await fetch(`/api/lab/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPublished }),
  });
  if (!res.ok) throw new Error("Failed to update lab project");
}

export function LabList() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const draggedIndex = useRef<number | null>(null);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["lab-projects"],
    queryFn: fetchLabProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLabProject,
    onMutate: async (id) => {
      setDeletingId(id);
      await queryClient.cancelQueries({ queryKey: ["lab-projects"] });
      const previous = queryClient.getQueryData<LabProject[]>(["lab-projects"]);
      queryClient.setQueryData<LabProject[]>(["lab-projects"], (old) =>
        old?.filter((p) => p.id !== id)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["lab-projects"], context?.previous);
    },
    onSettled: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["lab-projects"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderLabProjects,
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["lab-projects"] });
      const previous = queryClient.getQueryData<LabProject[]>(["lab-projects"]);
      if (previous) {
        const reordered = orderedIds
          .map((id) => previous.find((p) => p.id === id))
          .filter(Boolean) as LabProject[];
        queryClient.setQueryData<LabProject[]>(["lab-projects"], reordered);
      }
      return { previous };
    },
    onError: (err, orderedIds, context) => {
      queryClient.setQueryData(["lab-projects"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-projects"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
      togglePublished(id, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-projects"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, id: number, index: number) => {
    setDraggedId(id);
    draggedIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    draggedIndex.current = null;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!items || draggedIndex.current === null || draggedIndex.current === targetIndex) {
      handleDragEnd();
      return;
    }
    const newOrder = [...items];
    const [removed] = newOrder.splice(draggedIndex.current, 1);
    newOrder.splice(targetIndex, 0, removed);
    reorderMutation.mutate(newOrder.map((p) => p.id));
    handleDragEnd();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load lab projects. Please try again.
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No lab projects yet</p>
        <Link
          href="/admin/lab/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add your first lab project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Drag to reorder • Changes save automatically
      </p>
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id, index)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragEnd={handleDragEnd}
          onDrop={(e) => handleDrop(e, index)}
          className={`flex items-center gap-3 p-4 border transition-all ${
            draggedId === item.id
              ? "opacity-50 border-foreground/30"
              : dragOverId === item.id
              ? "border-foreground bg-muted/50"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          {item.thumbnail && (
            <div className="w-14 h-14 overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium truncate">{item.title}</h3>
              <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs capitalize">
                {item.category}
              </span>
              <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs">
                {item.tool}
              </span>
              {!item.isPublished && (
                <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 text-xs">
                  Draft
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {item.externalUrl}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMutation.mutate({ id: item.id, isPublished: !item.isPublished });
              }}
              disabled={toggleMutation.isPending}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={item.isPublished ? "Unpublish" : "Publish"}
            >
              {item.isPublished ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Open external link"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href={`/admin/lab/${item.id}`}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this lab project?")) {
                  deleteMutation.mutate(item.id);
                }
              }}
              disabled={deletingId === item.id}
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
