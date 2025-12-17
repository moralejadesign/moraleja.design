"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import type { Asset } from "@/db/schema";

interface AssetMetadataFormProps {
  asset: Asset;
  onSave: (data: Partial<Asset>) => Promise<void>;
  compact?: boolean;
}

export function AssetMetadataForm({ asset, onSave, compact = false }: AssetMetadataFormProps) {
  const [title, setTitle] = useState(asset.title || "");
  const [description, setDescription] = useState(asset.description || "");
  const [altText, setAltText] = useState(asset.altText || "");
  const [keywords, setKeywords] = useState(asset.keywords || "");
  const [tags, setTags] = useState<string[]>(asset.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const changed =
      title !== (asset.title || "") ||
      description !== (asset.description || "") ||
      altText !== (asset.altText || "") ||
      keywords !== (asset.keywords || "") ||
      JSON.stringify(tags) !== JSON.stringify(asset.tags || []);
    setHasChanges(changed);
  }, [title, description, altText, keywords, tags, asset]);

  // Autosave with debounce
  useEffect(() => {
    if (!hasChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave({ title, description, altText, keywords, tags });
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, description, altText, keywords, tags, hasChanges, onSave]);

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  if (compact) {
    return (
      <div className="space-y-3 p-3 bg-muted/30 border border-border text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Asset Metadata
          </span>
          {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full px-2 py-1.5 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />

        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Alt text (accessibility)"
          className="w-full px-2 py-1.5 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />

        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-foreground/10 text-xs"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="+ tag"
            className="w-16 px-1 py-0.5 bg-transparent text-xs focus:outline-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Asset Metadata</h3>
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Asset title for display and SEO"
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Alt Text
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image for accessibility"
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description for SEO and search"
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Keywords
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Comma-separated keywords for SEO"
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-foreground/10 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!newTag.trim()}
              className="px-3 py-2 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




