export const config = {
  blobBaseUrl: process.env.NEXT_PUBLIC_BLOB_BASE_URL || "https://xw2hxxlahhw8mflm.public.blob.vercel-storage.com",
} as const

export function getBlobUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `${config.blobBaseUrl}/${cleanPath}`
}

