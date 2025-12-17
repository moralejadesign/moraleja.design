"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Image as ImageIcon, Video, Loader2, ExternalLink, Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";
import type { Asset } from "@/db/schema";
import { TagSelector } from "./tag-selector";

type AssetWithProject = Asset & {
  projectTitle?: string;
  projectSlug?: string;
};

async function fetchAssets(params: { search?: string; type?: string }): Promise<AssetWithProject[]> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.type && params.type !== "all") searchParams.set("type", params.type);
  
  const res = await fetch(`/api/assets?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
}

async function deleteAsset(id: number): Promise<void> {
  const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete asset");
}

export function AssetsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["admin-assets", search, typeFilter],
    queryFn: () => fetchAssets({ search, type: typeFilter }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-assets"] });
      setDeleteConfirmId(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Failed to load assets</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </form>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | "image" | "video")}
          className="px-4 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
      </div>

      {/* Stats */}
      {assets && (
        <div className="text-sm text-muted-foreground">
          {assets.length} asset{assets.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : assets?.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No assets found</p>
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {assets?.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              isEditing={editingId === asset.id}
              onEdit={() => setEditingId(asset.id)}
              onCancelEdit={() => setEditingId(null)}
              isDeleteConfirm={deleteConfirmId === asset.id}
              onDeleteClick={() => setDeleteConfirmId(asset.id)}
              onDeleteConfirm={() => deleteMutation.mutate(asset.id)}
              onDeleteCancel={() => setDeleteConfirmId(null)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AssetRowProps {
  asset: AssetWithProject;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  isDeleteConfirm: boolean;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  isDeleting: boolean;
}

function AssetRow({
  asset,
  isEditing,
  onEdit,
  onCancelEdit,
  isDeleteConfirm,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
}: AssetRowProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: asset.title || "",
    description: asset.description || "",
    altText: asset.altText || "",
    keywords: asset.keywords || "",
    tags: asset.tags || [] as string[],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update asset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-assets"] });
      onCancelEdit();
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const missingMetadata = !asset.title && !asset.description && !asset.tags?.length;

  return (
    <div className="p-4">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-24 h-24 flex-shrink-0 bg-muted overflow-hidden relative">
          {asset.type === "video" ? (
            <video
              src={asset.url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={asset.url}
              alt={asset.altText || "Asset"}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-1 right-1 p-0.5 bg-black/50 text-white">
            {asset.type === "video" ? (
              <Video className="h-3 w-3" />
            ) : (
              <ImageIcon className="h-3 w-3" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Title"
                className="w-full px-2 py-1 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <input
                type="text"
                value={formData.altText}
                onChange={(e) => setFormData((p) => ({ ...p, altText: e.target.value }))}
                placeholder="Alt text"
                className="w-full px-2 py-1 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                rows={2}
                className="w-full px-2 py-1 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
              />
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Tags</label>
                <TagSelector
                  selectedTags={formData.tags}
                  onChange={(tags) => setFormData((p) => ({ ...p, tags }))}
                  compact
                />
              </div>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData((p) => ({ ...p, keywords: e.target.value }))}
                placeholder="Keywords (for SEO)"
                className="w-full px-2 py-1 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="px-3 py-1 bg-foreground text-background text-sm hover:bg-foreground/90 disabled:opacity-50 flex items-center gap-1"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1 border border-border text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-sm truncate">
                    {asset.title || asset.filename || "Untitled"}
                  </h3>
                  {asset.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {asset.description}
                    </p>
                  )}
                </div>
                {missingMetadata && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 text-xs">
                    Missing metadata
                  </span>
                )}
              </div>

              {asset.tags && asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-muted text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>ID: {asset.id}</span>
                {asset.projectId && (
                  <span>Project #{asset.projectId}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex flex-col gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-muted transition-colors"
              title="Edit metadata"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-muted transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {isDeleteConfirm ? (
              <div className="flex gap-1">
                <button
                  onClick={onDeleteConfirm}
                  disabled={isDeleting}
                  className="p-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  title="Confirm delete"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={onDeleteCancel}
                  className="p-1.5 hover:bg-muted transition-colors"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onDeleteClick}
                className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete asset"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



