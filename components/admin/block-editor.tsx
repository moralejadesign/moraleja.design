"use client";

import { useState, useCallback } from "react";
import {
  Image,
  Type,
  Heading1,
  Quote,
  Columns2,
  Plus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Video,
  LayoutPanelLeft,
} from "lucide-react";
import type { BlockType } from "@/db/schema";
import { ImageField, ImageUploader, VideoField } from "./image-uploader";

interface BlockEditorProps {
  blocks: BlockType[];
  onChange: (blocks: BlockType[]) => void;
}

const BLOCK_TYPES = [
  { type: "full-image", label: "Full Image", icon: Image },
  { type: "two-column", label: "Two Column", icon: Columns2 },
  { type: "image-text", label: "Image + Text", icon: LayoutPanelLeft },
  { type: "video", label: "Video", icon: Video },
  { type: "text", label: "Text", icon: Type },
  { type: "heading", label: "Heading", icon: Heading1 },
  { type: "quote", label: "Quote", icon: Quote },
] as const;

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addBlock = useCallback(
    (type: BlockType["type"]) => {
      let newBlock: BlockType;
      switch (type) {
        case "full-image":
          newBlock = { type: "full-image", url: "", alt: "" };
          break;
        case "two-column":
          newBlock = { type: "two-column", left: "", right: "" };
          break;
        case "image-text":
          newBlock = { type: "image-text", image: "", text: "", imagePosition: "left", ratio: "50-50" };
          break;
        case "video":
          newBlock = { type: "video", url: "", autoplay: true };
          break;
        case "text":
          newBlock = { type: "text", content: "" };
          break;
        case "heading":
          newBlock = { type: "heading", content: "", level: 2 };
          break;
        case "quote":
          newBlock = { type: "quote", content: "", author: "" };
          break;
        default:
          return;
      }
      onChange([...blocks, newBlock]);
      setShowAddMenu(false);
    },
    [blocks, onChange]
  );

  const updateBlock = useCallback(
    (index: number, updates: Partial<BlockType>) => {
      const newBlocks = [...blocks];
      newBlocks[index] = { ...newBlocks[index], ...updates } as BlockType;
      onChange(newBlocks);
    },
    [blocks, onChange]
  );

  const removeBlock = useCallback(
    (index: number) => {
      onChange(blocks.filter((_, i) => i !== index));
    },
    [blocks, onChange]
  );

  const moveBlock = useCallback(
    (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return;

      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[newIndex]] = [
        newBlocks[newIndex],
        newBlocks[index],
      ];
      onChange(newBlocks);
    },
    [blocks, onChange]
  );

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="group relative border border-border p-4 bg-background"
        >
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => moveBlock(index, "up")}
              disabled={index === 0}
              className="p-1 bg-muted hover:bg-muted-foreground/20 disabled:opacity-30"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => moveBlock(index, "down")}
              disabled={index === blocks.length - 1}
              className="p-1 bg-muted hover:bg-muted-foreground/20 disabled:opacity-30"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <div className="absolute -right-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => removeBlock(index)}
              className="p-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          <BlockContent
            block={block}
            onChange={(updates) => updateBlock(index, updates)}
          />
        </div>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-3 border-2 border-dashed border-muted-foreground/25 flex items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Block
        </button>

        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-background border border-border shadow-lg z-10 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="flex flex-col items-center gap-1 p-3 hover:bg-muted transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface BlockContentProps {
  block: BlockType;
  onChange: (updates: Partial<BlockType>) => void;
}

function BlockContent({ block, onChange }: BlockContentProps) {
  switch (block.type) {
    case "full-image":
      return (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Full Width Image
          </div>
          <ImageField
            value={block.url}
            onChange={(url) => onChange({ url })}
          />
          <input
            type="text"
            value={block.alt || ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text (optional)"
            className="w-full px-3 py-2 bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
      );

    case "two-column":
      return (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Two Column Images
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageField
              value={block.left}
              onChange={(left) => onChange({ left })}
              label="Left"
            />
            <ImageField
              value={block.right}
              onChange={(right) => onChange({ right })}
              label="Right"
            />
          </div>
        </div>
      );

    case "image-text":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Image + Text
            </div>
            <div className="flex items-center gap-2">
              <select
                value={block.imagePosition}
                onChange={(e) => onChange({ imagePosition: e.target.value as "left" | "right" })}
                className="px-2 py-1 bg-muted/50 border border-border text-xs focus:outline-none"
              >
                <option value="left">Image Left</option>
                <option value="right">Image Right</option>
              </select>
              <select
                value={block.ratio}
                onChange={(e) => onChange({ ratio: e.target.value as "50-50" | "60-40" | "40-60" | "70-30" | "30-70" })}
                className="px-2 py-1 bg-muted/50 border border-border text-xs focus:outline-none"
              >
                <option value="50-50">50 / 50</option>
                <option value="60-40">60 / 40</option>
                <option value="40-60">40 / 60</option>
                <option value="70-30">70 / 30</option>
                <option value="30-70">30 / 70</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={block.imagePosition === "right" ? "order-2" : ""}>
              <ImageField
                value={block.image}
                onChange={(image) => onChange({ image })}
                label="Image"
              />
            </div>
            <div className={block.imagePosition === "right" ? "order-1" : ""}>
              <label className="text-sm font-medium text-muted-foreground">Text</label>
              <textarea
                value={block.text}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder="Enter your text..."
                rows={6}
                className="w-full mt-2 px-3 py-2 bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
              />
            </div>
          </div>
        </div>
      );

    case "video":
      return (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Video
          </div>
          <VideoField
            value={block.url}
            onChange={(url) => onChange({ url })}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={block.autoplay ?? true}
              onChange={(e) => onChange({ autoplay: e.target.checked })}
              className="rounded border-border"
            />
            Autoplay (muted, loops)
          </label>
        </div>
      );

    case "text":
      return (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Text Block
          </div>
          <textarea
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Enter your text..."
            rows={4}
            className="w-full px-3 py-2 bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
          />
        </div>
      );

    case "heading":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Heading
            </div>
            <select
              value={block.level}
              onChange={(e) =>
                onChange({ level: parseInt(e.target.value) as 1 | 2 | 3 })
              }
              className="px-2 py-1 bg-muted/50 border border-border text-xs focus:outline-none"
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>
          <input
            type="text"
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Heading text..."
            className={`w-full px-3 py-2 bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20 ${
              block.level === 1
                ? "text-2xl font-bold"
                : block.level === 2
                ? "text-xl font-semibold"
                : "text-lg font-medium"
            }`}
          />
        </div>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quote
          </div>
          <textarea
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Quote text..."
            rows={3}
            className="w-full px-3 py-2 bg-muted/50 border border-border text-sm italic focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
          />
          <input
            type="text"
            value={block.author || ""}
            onChange={(e) => onChange({ author: e.target.value })}
            placeholder="Author (optional)"
            className="w-full px-3 py-2 bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
      );

    default:
      return null;
  }
}
