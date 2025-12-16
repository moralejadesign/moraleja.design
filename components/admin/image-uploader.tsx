"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Loader2, Video, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { Asset } from "@/db/schema";
import { TagSelector } from "./tag-selector";

export type UploadResult = {
  url: string;
  assetId: number;
  asset: Asset;
};

async function createAssetRecord(
  url: string,
  filename: string,
  type: "image" | "video",
  projectId?: number
): Promise<Asset> {
  const res = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, filename, type, projectId }),
  });
  if (!res.ok) throw new Error("Failed to create asset record");
  return res.json();
}

interface ImageUploaderProps {
  onUpload: (url: string, assetId?: number) => void;
  projectId?: number;
  className?: string;
}

export function ImageUploader({ onUpload, projectId, className = "" }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      setIsUploading(true);
      setError(null);
      setProgress(0);
      setPreview(URL.createObjectURL(file));

      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload/client",
          onUploadProgress: (e) => {
            setProgress(e.percentage);
          },
        });

        // Create asset record in database
        const asset = await createAssetRecord(blob.url, file.name, "image", projectId);
        onUpload(blob.url, asset.id);
        setPreview(null);
      } catch (error) {
        console.error("Upload error:", error);
        setError((error as Error).message || "Failed to upload image");
        setPreview(null);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [onUpload, projectId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            uploadFile(file);
            break;
          }
        }
      }
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <div
      className={`relative ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {error && (
        <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          {error}
        </div>
      )}
      {preview ? (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setError(null); fileInputRef.current?.click(); }}
          className={`w-full aspect-video border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
            isDragging
              ? "border-foreground bg-muted"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop image, paste, or click to upload
          </p>
        </button>
      )}
    </div>
  );
}

// Inline metadata editor for assets
interface InlineMetadataEditorProps {
  assetUrl: string;
  onUpdate?: () => void;
}

function InlineMetadataEditor({ assetUrl, onUpdate }: InlineMetadataEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    altText: "",
    description: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (isOpen && !asset && assetUrl) {
      setIsLoading(true);
      // Fetch asset by URL
      fetch(`/api/assets?url=${encodeURIComponent(assetUrl)}`)
        .then((res) => res.json())
        .then((assets: Asset[]) => {
          const found = assets.find((a) => a.url === assetUrl);
          if (found) {
            setAsset(found);
            setFormData({
              title: found.title || "",
              altText: found.altText || "",
              description: found.description || "",
              tags: found.tags || [],
            });
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, asset, assetUrl]);

  const handleSave = async () => {
    if (!asset) return;
    setIsSaving(true);
    try {
      await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setAsset({ ...asset, ...formData });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Pencil className="h-3 w-3" />
        Edit metadata
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-muted/30 border border-border space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : asset ? (
            <>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Title"
                className="w-full px-2 py-1.5 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <input
                type="text"
                value={formData.altText}
                onChange={(e) => setFormData((p) => ({ ...p, altText: e.target.value }))}
                placeholder="Alt text (accessibility)"
                className="w-full px-2 py-1.5 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                rows={2}
                className="w-full px-2 py-1.5 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
              />
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Tags</label>
                <TagSelector
                  selectedTags={formData.tags}
                  onChange={(tags) => setFormData((p) => ({ ...p, tags }))}
                  compact
                />
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 bg-foreground text-background text-xs hover:bg-foreground/90 disabled:opacity-50 flex items-center gap-1"
              >
                {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                Save metadata
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Asset not found in database. Upload a new image to create an asset record.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ImageFieldProps {
  value: string;
  onChange: (url: string, assetId?: number) => void;
  label?: string;
  projectId?: number;
}

export function ImageField({ value, onChange, label, projectId }: ImageFieldProps) {
  if (value) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative group">
          <img
            src={value}
            alt="Uploaded"
            className="w-full aspect-video object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <InlineMetadataEditor assetUrl={value} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <ImageUploader onUpload={onChange} projectId={projectId} />
    </div>
  );
}

interface VideoUploaderProps {
  onUpload: (url: string, assetId?: number) => void;
  projectId?: number;
  className?: string;
}

export function VideoUploader({ onUpload, projectId, className = "" }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        setError("Please upload a video file");
        return;
      }

      // Max 500MB for client-side uploads
      const MAX_SIZE = 500 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError(`Video too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 500MB.`);
        return;
      }

      setIsUploading(true);
      setError(null);
      setProgress(0);
      setPreview(URL.createObjectURL(file));

      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload/client",
          onUploadProgress: (e) => {
            setProgress(e.percentage);
          },
        });

        // Create asset record in database
        const asset = await createAssetRecord(blob.url, file.name, "video", projectId);
        onUpload(blob.url, asset.id);
        setPreview(null);
      } catch (error) {
        console.error("Upload error:", error);
        setError((error as Error).message || "Failed to upload video");
        setPreview(null);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [onUpload, projectId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <div
      className={`relative ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {error && (
        <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          {error}
        </div>
      )}
      {preview ? (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <video
            src={preview}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setError(null); fileInputRef.current?.click(); }}
          className={`w-full aspect-video border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
            isDragging
              ? "border-foreground bg-muted"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <Video className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop video or click to upload (max 500MB)
          </p>
        </button>
      )}
    </div>
  );
}

interface VideoFieldProps {
  value: string;
  onChange: (url: string, assetId?: number) => void;
  projectId?: number;
}

export function VideoField({ value, onChange, projectId }: VideoFieldProps) {
  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative group">
          <video
            src={value}
            className="w-full aspect-video object-cover"
            muted
            playsInline
            loop
            autoPlay
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <InlineMetadataEditor assetUrl={value} />
      </div>
    );
  }

  return <VideoUploader onUpload={onChange} projectId={projectId} />;
}
