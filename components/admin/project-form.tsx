"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Eye, Check, Cloud } from "lucide-react";
import Link from "next/link";
import type { Project, BlockType } from "@/db/schema";
import { BlockEditor } from "./block-editor";
import { ImageField } from "./image-uploader";

interface ProjectFormProps {
  project?: Project;
  isNew?: boolean;
}

type ProjectInput = {
  slug: string;
  title: string;
  thumbnail: string;
  heightRatio: number;
  textContrast: string;
  blocks: BlockType[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

async function createProject(data: ProjectInput): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

async function updateProject({
  id,
  data,
}: {
  id: number;
  data: Partial<ProjectInput>;
}): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export function ProjectForm({ project, isNew }: ProjectFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProjectInput>({
    slug: project?.slug ?? "",
    title: project?.title ?? "",
    thumbnail: project?.thumbnail ?? "",
    heightRatio: project?.heightRatio ?? 1.5,
    textContrast: project?.textContrast ?? "light",
    blocks: (project?.blocks as BlockType[]) ?? [],
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedData = useRef<string>(JSON.stringify(formData));
  const isFirstRender = useRef(true);

  // Detect changes
  useEffect(() => {
    if (project) {
      const hasChanged =
        formData.slug !== project.slug ||
        formData.title !== project.title ||
        formData.thumbnail !== project.thumbnail ||
        formData.heightRatio !== project.heightRatio ||
        formData.textContrast !== project.textContrast ||
        JSON.stringify(formData.blocks) !== JSON.stringify(project.blocks);
      setHasChanges(hasChanged);
    } else {
      setHasChanges(formData.title.length > 0);
    }
  }, [formData, project]);

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/admin/projects/${newProject.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProject,
    onMutate: async ({ id, data }) => {
      setSaveStatus("saving");
      await queryClient.cancelQueries({ queryKey: ["project", id] });
      const previousProject = queryClient.getQueryData<Project>([
        "project",
        id,
      ]);
      queryClient.setQueryData<Project>(["project", id], (old) =>
        old ? { ...old, ...data } : old
      );
      return { previousProject };
    },
    onError: (err, { id }, context) => {
      queryClient.setQueryData(["project", id], context?.previousProject);
      setSaveStatus("error");
    },
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      lastSavedData.current = JSON.stringify({ ...formData, ...data });
      setSaveStatus("saved");
      setHasChanges(false);
    },
  });

  // Autosave effect (debounced)
  useEffect(() => {
    // Skip autosave for new projects or on first render
    if (isNew || !project || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Check if data actually changed since last save
    const currentData = JSON.stringify(formData);
    if (currentData === lastSavedData.current) {
      return;
    }

    // Don't autosave if already saving
    if (updateMutation.isPending) {
      return;
    }

    const timeout = setTimeout(() => {
      updateMutation.mutate({ id: project.id, data: formData });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [formData, isNew, project, updateMutation.isPending]);

  // Reset saved status after delay
  useEffect(() => {
    if (saveStatus === "saved") {
      const timeout = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(timeout);
    }
  }, [saveStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      createMutation.mutate(formData);
    } else if (project) {
      updateMutation.mutate({ id: project.id, data: formData });
    }
  };

  const updateField = <K extends keyof ProjectInput>(
    field: K,
    value: ProjectInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/projects"
            className="p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Project" : "Edit Project"}
            </h1>
            {!isNew && project && (
              <p className="text-sm text-muted-foreground">/{project.slug}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Autosave status indicator */}
          {!isNew && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <span className="text-destructive">Save failed</span>
              )}
              {saveStatus === "idle" && hasChanges && (
                <>
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Unsaved</span>
                </>
              )}
            </div>
          )}

          {!isNew && project && (
            <Link
              href={`/project/${project.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          )}
          <button
            type="submit"
            disabled={isPending || (!isNew && !hasChanges)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    updateField("title", e.target.value);
                    if (isNew) {
                      updateField(
                        "slug",
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                      );
                    }
                  }}
                  placeholder="Project Title"
                  className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Slug
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-muted border border-r-0 border-border text-muted-foreground">
                    /project/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      updateField(
                        "slug",
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "")
                      )
                    }
                    placeholder="project-slug"
                    className="flex-1 px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Content Blocks</h2>
            <BlockEditor
              blocks={formData.blocks}
              onChange={(blocks) => updateField("blocks", blocks)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Thumbnail</h2>
            <ImageField
              value={formData.thumbnail}
              onChange={(thumbnail) => updateField("thumbnail", thumbnail)}
            />
          </div>

          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Display Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Grid Height Ratio
                </label>
                <input
                  type="number"
                  value={formData.heightRatio}
                  onChange={(e) =>
                    updateField("heightRatio", parseFloat(e.target.value) || 1.5)
                  }
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Controls card height in masonry grid (0.5-3)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Text Contrast
                </label>
                <select
                  value={formData.textContrast}
                  onChange={(e) => updateField("textContrast", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                >
                  <option value="light">Light (for dark thumbnails)</option>
                  <option value="dark">Dark (for light thumbnails)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
