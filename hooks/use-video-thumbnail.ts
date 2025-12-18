import { useState, useEffect, useRef } from "react";

/**
 * Hook to generate a thumbnail from a video by extracting a frame
 * @param videoUrl - URL of the video
 * @param timeOffset - Time in seconds to extract frame from (default: 1 second)
 * @returns Object with thumbnail URL and loading state
 */
export function useVideoThumbnail(
  videoUrl: string | null,
  timeOffset: number = 1
): { thumbnailUrl: string | null; isLoading: boolean; error: Error | null } {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!videoUrl) {
      setIsLoading(false);
      return;
    }

    // Check if we already have a cached thumbnail
    const cacheKey = `video-thumb-${videoUrl}-${timeOffset}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setThumbnailUrl(cached);
      setIsLoading(false);
      return;
    }

    // Create video element to extract frame
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;

    // Create canvas to draw frame
    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;

    const handleLoadedMetadata = () => {
      try {
        // Seek to the desired time offset (or 10% of duration, whichever is smaller)
        // Use a small offset to avoid black frames at the start
        const seekTime = Math.min(timeOffset, Math.max(0.1, video.duration * 0.1));
        video.currentTime = seekTime;
      } catch (err) {
        console.warn("Failed to seek video:", err);
        // Try to seek to a small offset if duration is not available
        try {
          video.currentTime = 0.1;
        } catch {
          video.currentTime = 0;
        }
      }
    };

    const handleSeeked = () => {
      try {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setThumbnailUrl(dataUrl);
          sessionStorage.setItem(cacheKey, dataUrl);
          setIsLoading(false);
        } else {
          throw new Error("Could not get canvas context");
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to generate thumbnail"));
        setIsLoading(false);
      }
    };

    const handleError = (err: Event) => {
      setError(new Error("Failed to load video for thumbnail"));
      setIsLoading(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);

    video.src = videoUrl;

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      video.src = "";
      video.load();
    };
  }, [videoUrl, timeOffset]);

  return { thumbnailUrl, isLoading, error };
}
