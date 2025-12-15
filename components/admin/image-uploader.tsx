"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2, Video } from "lucide-react";

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  className?: string;
}

export function ImageUploader({ onUpload, className = "" }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      // Vercel serverless limit is ~4.5MB
      const MAX_SIZE = 4.5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 4.5MB`);
        return;
      }

      setIsUploading(true);
      setError(null);
      setPreview(URL.createObjectURL(file));

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        // Handle non-JSON responses (like Vercel's error pages)
        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error(`Upload failed: Server returned ${res.status}. File may be too large.`);
        }

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.details || data.error || "Upload failed");
        }

        onUpload(data.url);
        setPreview(null);
      } catch (error) {
        console.error("Upload error:", error);
        setError((error as Error).message || "Failed to upload image");
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
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
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
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

interface ImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageField({ value, onChange, label }: ImageFieldProps) {
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
      <ImageUploader onUpload={onChange} />
    </div>
  );
}

interface VideoUploaderProps {
  onUpload: (url: string) => void;
  className?: string;
}

export function VideoUploader({ onUpload, className = "" }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        setError("Please upload a video file");
        return;
      }

      // Vercel serverless limit is ~4.5MB
      const MAX_SIZE = 4.5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError(`Video too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 4.5MB. Compress your video first.`);
        return;
      }

      setIsUploading(true);
      setError(null);
      setPreview(URL.createObjectURL(file));

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        // Handle non-JSON responses (like Vercel's error pages)
        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error(`Upload failed: Server returned ${res.status}. File may be too large.`);
        }

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.details || data.error || "Upload failed");
        }

        onUpload(data.url);
        setPreview(null);
      } catch (error) {
        console.error("Upload error:", error);
        setError((error as Error).message || "Failed to upload video");
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
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
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
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
            Drop video or click to upload
          </p>
        </button>
      )}
    </div>
  );
}

interface VideoFieldProps {
  value: string;
  onChange: (url: string) => void;
}

export function VideoField({ value, onChange }: VideoFieldProps) {
  if (value) {
    return (
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
    );
  }

  return <VideoUploader onUpload={onChange} />;
}
