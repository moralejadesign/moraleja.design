export const config = {
  blobBaseUrl: "https://oi0bl4shqruqbuco.public.blob.vercel-storage.com",
} as const

export function getBlobUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `${config.blobBaseUrl}/${cleanPath}`
}

