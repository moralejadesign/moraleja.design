"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Eye, Check, Cloud } from "lucide-react";
import Link from "next/link";
import type { LabProject, LabTool, LabCategory } from "@/db/schema";
import { ImageField } from "./image-uploader";
import { TagSelector } from "./tag-selector";

interface LabFormProps {
  item?: LabProject;
  isNew?: boolean;
}

type LabInput = {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  externalUrl: string;
  tool: LabTool;
  category: LabCategory;
  tags: string[];
  isPublished: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const LAB_TOOLS: { value: LabTool; label: string; category: LabCategory }[] = [
  { value: "v0", label: "v0", category: "code" },
  { value: "Cursor", label: "Cursor", category: "code" },
  { value: "Claude Code", label: "Claude Code", category: "code" },
  { value: "Midjourney", label: "Midjourney", category: "creative" },
  { value: "Higgsfield", label: "Higgsfield", category: "creative" },
  { value: "Image 2.0", label: "Image 2.0", category: "creative" },
  { value: "Nano Banana", label: "Nano Banana", category: "creative" },
];

async function createLabProject(data: LabInput): Promise<LabProject> {
  const res = await fetch("/api/lab", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create lab project");
  return res.json();
}

async function updateLabProject({ id, data }: { id: number; data: Partial<LabInput> }): Promise<LabProject> {
  const res = await fetch(`/api/lab/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update lab project");
  return res.json();
}

export function LabForm({ item, isNew }: LabFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<LabInput>({
    slug: item?.slug ?? "",
    title: item?.title ?? "",
    description: item?.description ?? "",
    thumbnail: item?.thumbnail ?? "",
    externalUrl: item?.externalUrl ?? "",
    tool: item?.tool ?? "v0",
    category: item?.category ?? "code",
    tags: item?.tags ?? [],
    isPublished: item?.isPublished ?? false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedData = useRef<string>(JSON.stringify(formData));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (item) {
      const currentData = JSON.stringify(formData);
      const originalData = JSON.stringify({
        slug: item.slug,
        title: item.title,
        description: item.description ?? "",
        thumbnail: item.thumbnail,
        externalUrl: item.externalUrl,
        tool: item.tool,
        category: item.category,
        tags: item.tags ?? [],
        isPublished: item.isPublished,
      });
      setHasChanges(currentData !== originalData);
    } else {
      setHasChanges(formData.title.length > 0);
    }
  }, [formData, item]);

  const createMutation = useMutation({
    mutationFn: createLabProject,
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ["lab-projects"] });
      router.push(`/admin/lab/${newItem.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLabProject,
    onMutate: () => setSaveStatus("saving"),
    onError: () => setSaveStatus("error"),
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: ["lab-projects"] });
      lastSavedData.current = JSON.stringify({ ...formData, ...data });
      setSaveStatus("saved");
      setHasChanges(false);
    },
  });

  useEffect(() => {
    if (isNew || !item || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const currentData = JSON.stringify(formData);
    if (currentData === lastSavedData.current || updateMutation.isPending) return;

    const timeout = setTimeout(() => {
      updateMutation.mutate({ id: item.id, data: formData });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [formData, isNew, item, updateMutation.isPending]);

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
    } else if (item) {
      updateMutation.mutate({ id: item.id, data: formData });
    }
  };

  const updateField = <K extends keyof LabInput>(field: K, value: LabInput[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-set category when tool changes
  const handleToolChange = (tool: LabTool) => {
    const toolDef = LAB_TOOLS.find((t) => t.value === tool);
    updateField("tool", tool);
    if (toolDef) updateField("category", toolDef.category);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/lab" className="p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Lab Project" : "Edit Lab Project"}
            </h1>
            {!isNew && item && (
              <p className="text-sm text-muted-foreground">{item.externalUrl}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          {!isNew && item && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </a>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Tool
                  </label>
                  <select
                    value={formData.tool}
                    onChange={(e) => handleToolChange(e.target.value as LabTool)}
                    className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  >
                    <optgroup label="Code">
                      {LAB_TOOLS.filter((t) => t.category === "code").map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Creative">
                      {LAB_TOOLS.filter((t) => t.category === "creative").map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField("category", e.target.value as LabCategory)}
                    className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  >
                    <option value="code">Code</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  External URL
                </label>
                <input
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => updateField("externalUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Thumbnail</h2>
            <ImageField
              value={formData.thumbnail}
              onChange={(url) => updateField("thumbnail", url)}
            />
          </div>

          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Publishing</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => updateField("isPublished", e.target.checked)}
                className="w-4 h-4"
              />
              <div>
                <span className="font-medium">Published</span>
                <p className="text-xs text-muted-foreground">
                  Make this visible in the Lab
                </p>
              </div>
            </label>
          </div>

          <div className="p-6 border border-border">
            <TagSelector
              selectedTags={formData.tags}
              onChange={(tags) => updateField("tags", tags)}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
