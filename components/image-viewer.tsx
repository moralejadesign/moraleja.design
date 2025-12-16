"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Image as ImageIcon,
  Video,
  Info,
} from "lucide-react";
import { isImageCached, markImageCached, preloadImage } from "@/lib/image-cache";

type GalleryAsset = {
  id: number;
  url: string;
  type: string;
  title: string | null;
  description: string | null;
  altText: string | null;
  tags: string[] | null;
  projectId: number | null;
  projectTitle: string | null;
  projectSlug: string | null;
};

interface ImageViewerProps {
  asset: GalleryAsset;
  assets: GalleryAsset[];
  onClose: () => void;
  onNavigate: (id: number) => void;
}

export function ImageViewer({
  asset,
  assets,
  onClose,
  onNavigate,
}: ImageViewerProps) {
  const [showInfo, setShowInfo] = useState(true);
  const [isLoaded, setIsLoaded] = useState(() => isImageCached(asset.url));
  const [isExiting, setIsExiting] = useState(false);
  const preloadedRef = useRef<Set<string>>(new Set());

  const currentIndex = assets.findIndex((a) => a.id === asset.id);
  const prevAsset = currentIndex > 0 ? assets[currentIndex - 1] : null;
  const nextAsset = currentIndex < assets.length - 1 ? assets[currentIndex + 1] : null;

  // Preload adjacent images for faster navigation
  useEffect(() => {
    const toPreload = [prevAsset, nextAsset]
      .filter((a): a is GalleryAsset => a !== null && a.type === "image")
      .map((a) => a.url)
      .filter((url) => !preloadedRef.current.has(url) && !isImageCached(url));

    toPreload.forEach((url) => {
      preloadedRef.current.add(url);
      preloadImage(url).catch(() => {
        // Ignore preload errors
      });
    });
  }, [prevAsset, nextAsset]);

  // Check if current image is already cached
  useEffect(() => {
    if (isImageCached(asset.url)) {
      setIsLoaded(true);
    }
  }, [asset.url]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  const handlePrev = useCallback(() => {
    if (prevAsset) {
      setIsLoaded(false);
      onNavigate(prevAsset.id);
    }
  }, [prevAsset, onNavigate]);

  const handleNext = useCallback(() => {
    if (nextAsset) {
      setIsLoaded(false);
      onNavigate(nextAsset.id);
    }
  }, [nextAsset, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          handleClose();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "i":
          setShowInfo((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleClose, handlePrev, handleNext]);

  // Reset loaded state when asset changes (but check cache first)
  useEffect(() => {
    if (asset.type === "image" && isImageCached(asset.url)) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [asset.id, asset.url, asset.type]);

  // Mark as cached when loaded
  const handleImageLoad = useCallback(() => {
    markImageCached(asset.url);
    setIsLoaded(true);
  }, [asset.url]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-200 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 p-2 text-white/60 hover:text-white transition-colors"
        aria-label="Close viewer"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Info toggle */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className={`absolute top-4 right-14 z-20 p-2 transition-colors ${
          showInfo ? "text-white" : "text-white/60 hover:text-white"
        }`}
        aria-label="Toggle info"
      >
        <Info className="h-5 w-5" />
      </button>

      {/* Navigation counter */}
      <div className="absolute top-4 left-4 z-20 font-mono text-xs text-white/40">
        {currentIndex + 1} / {assets.length}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 md:p-8">
        {/* Previous button */}
        {prevAsset && (
          <button
            onClick={handlePrev}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 text-white/40 hover:text-white transition-all hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8 md:h-10 md:w-10" />
          </button>
        )}

        {/* Image/Video container */}
        <div className="relative flex max-h-[85vh] max-w-[85vw] flex-col items-center">
          {/* Media */}
          <div className="relative">
            {asset.type === "video" ? (
              <video
                key={asset.id}
                src={asset.url}
                className={`max-h-[70vh] max-w-full object-contain transition-opacity duration-300 ${
                  isLoaded ? "opacity-100" : "opacity-0"
                }`}
                controls
                autoPlay
                muted
                loop
                onLoadedData={() => setIsLoaded(true)}
              />
            ) : (
              <>
                {/* Blur placeholder - shows immediately with cached thumbnail */}
                <img
                  src={asset.url}
                  alt=""
                  aria-hidden="true"
                  className={`absolute inset-0 max-h-[70vh] max-w-full object-contain blur-xl scale-105 transition-opacity duration-300 ${
                    isLoaded ? "opacity-0" : "opacity-50"
                  }`}
                  style={{ filter: "blur(20px)" }}
                />
                {/* Main image */}
                <img
                  key={asset.id}
                  src={asset.url}
                  alt={asset.altText || asset.title || "Gallery image"}
                  className={`max-h-[70vh] max-w-full object-contain transition-opacity duration-200 ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onLoad={handleImageLoad}
                />
              </>
            )}

            {/* Loading indicator */}
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-6 w-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            )}

            {/* Type indicator */}
            <div className="absolute top-3 left-3 p-1.5 bg-black/50 text-white/70">
              {asset.type === "video" ? (
                <Video className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </div>
          </div>

          {/* Info panel - subtle at bottom */}
          <div
            className={`mt-4 w-full max-w-2xl transition-all duration-300 ${
              showInfo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="text-center space-y-3">
              {/* Title */}
              {asset.title && (
                <h2 className="text-lg font-medium text-white tracking-wide">
                  {asset.title}
                </h2>
              )}

              {/* Description */}
              {asset.description && (
                <p className="text-sm text-white/60 max-w-lg mx-auto leading-relaxed">
                  {asset.description}
                </p>
              )}

              {/* Tags */}
              {asset.tags && asset.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white/10 text-white/50 text-xs font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Project link */}
              {asset.projectTitle && asset.projectSlug && (
                <Link
                  href={`/project/${asset.projectSlug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors group"
                >
                  <span>View project: {asset.projectTitle}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Next button */}
        {nextAsset && (
          <button
            onClick={handleNext}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 text-white/40 hover:text-white transition-all hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8 md:h-10 md:w-10" />
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 text-[10px] text-white/30 font-mono">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">→</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">i</kbd>
          info
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">esc</kbd>
          close
        </span>
      </div>
    </div>
  );
}
