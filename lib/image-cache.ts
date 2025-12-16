// Shared image cache for the gallery and lightbox
// Tracks which images have been fully loaded to avoid reload delays

const imageCache = new Set<string>();

export function isImageCached(url: string): boolean {
  return imageCache.has(url);
}

export function markImageCached(url: string): void {
  imageCache.add(url);
}

export function preloadImage(url: string): Promise<void> {
  if (imageCache.has(url)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.add(url);
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });
}
