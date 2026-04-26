"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { LabProject, LabCategory } from "@/db/schema";

const TOOL_COLORS: Record<string, string> = {
  "v0": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Cursor": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Claude Code": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "Midjourney": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Higgsfield": "bg-green-500/10 text-green-600 dark:text-green-400",
  "Image 2.0": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "Nano Banana": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

interface LabGridProps {
  items: LabProject[];
  availableTags: string[];
}

interface SectionProps {
  title: string;
  description: string;
  items: LabProject[];
}

function LabCard({ item }: { item: LabProject }) {
  const toolColor = TOOL_COLORS[item.tool] ?? "bg-muted text-muted-foreground";

  return (
    <a
      href={item.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col border border-border hover:border-foreground/30 transition-all duration-200"
    >
      <div className="relative overflow-hidden aspect-video bg-muted">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <ExternalLink className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug">{item.title}</h3>
          <span className={`flex-shrink-0 px-2 py-0.5 text-[11px] font-medium rounded-full ${toolColor}`}>
            {item.tool}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {item.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-muted text-muted-foreground text-[11px]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

function LabSection({ title, description, items }: SectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <LabCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function LabGrid({ items, availableTags }: LabGridProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag
    ? items.filter((item) => item.tags?.includes(activeTag))
    : items;

  const codeItems = filtered.filter((item) => item.category === "code");
  const creativeItems = filtered.filter((item) => item.category === "creative");

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Nothing in the lab yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              activeTag === null
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
            }`}
          >
            All
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                activeTag === tag
                  ? "bg-foreground text-background"
                  : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <LabSection
        title="Code"
        description="Projects built with AI coding tools"
        items={codeItems}
      />
      <LabSection
        title="Creative"
        description="Experiments with AI creative tools"
        items={creativeItems}
      />
    </div>
  );
}
