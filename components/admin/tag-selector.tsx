"use client";

import { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { PREDEFINED_TAGS, formatTagForDisplay, normalizeTag } from "@/lib/tags";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  compact?: boolean;
}

export function TagSelector({ selectedTags, onChange, compact = false }: TagSelectorProps) {
  const [newTag, setNewTag] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const normalizedSelected = selectedTags.map(normalizeTag);

  const toggleTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    if (normalizedSelected.includes(normalized)) {
      onChange(selectedTags.filter((t) => normalizeTag(t) !== normalized));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const tag = newTag.trim();
    if (tag && !normalizedSelected.includes(normalizeTag(tag))) {
      onChange([...selectedTags, formatTagForDisplay(tag)]);
      setNewTag("");
      setShowCustomInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    } else if (e.key === "Escape") {
      setShowCustomInput(false);
      setNewTag("");
    }
  };

  // Get custom tags (tags not in predefined list)
  const customTags = selectedTags.filter(
    (tag) => !PREDEFINED_TAGS.map(normalizeTag).includes(normalizeTag(tag))
  );

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {PREDEFINED_TAGS.map((tag) => {
            const isSelected = normalizedSelected.includes(normalizeTag(tag));
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 text-xs transition-colors ${
                  isSelected
                    ? "bg-foreground text-background"
                    : "bg-muted hover:bg-muted-foreground/20"
                }`}
              >
                {tag}
              </button>
            );
          })}
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-foreground text-background text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="hover:text-background/70"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {showCustomInput ? (
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newTag.trim()) setShowCustomInput(false);
              }}
              placeholder="Custom tag..."
              autoFocus
              className="w-24 px-1 py-0.5 bg-background border border-border text-xs focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/50 hover:border-foreground/50"
            >
              + Custom
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-muted-foreground">
        Tags
      </label>
      
      {/* Predefined Tags */}
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_TAGS.map((tag) => {
          const isSelected = normalizedSelected.includes(normalizeTag(tag));
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                isSelected
                  ? "bg-foreground text-background"
                  : "bg-muted hover:bg-muted-foreground/20"
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {tag}
            </button>
          );
        })}
      </div>

      {/* Custom Tags */}
      {customTags.length > 0 && (
        <div className="pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground mb-2 block">Custom tags:</span>
          <div className="flex flex-wrap gap-2">
            {customTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="hover:text-background/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Tag */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add custom tag..."
          className="flex-1 px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
        <button
          type="button"
          onClick={addCustomTag}
          disabled={!newTag.trim()}
          className="px-3 py-2 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}




