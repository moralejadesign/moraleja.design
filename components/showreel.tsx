"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export type ReelItem = { src: string; title?: string; href?: string }

/**
 * Plays each item's video in turn and links to the project currently showing.
 * Only plays while on screen and respects reduced motion.
 */
export function Showreel({ items }: { items: ReelItem[] }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const visibleRef = useRef(false)
  const [index, setIndex] = useState(0)
  const item = items[index] ?? items[0]
  const isPlaylist = items.length > 1

  const play = () => {
    const video = videoRef.current
    if (!video || !visibleRef.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    video.play().catch(() => {})
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
        if (entry.isIntersecting) play()
        else video.pause()
      },
      { rootMargin: "200px 0px", threshold: 0.1 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  // Start the next clip as soon as its source swaps in
  useEffect(play, [index])

  if (!item) return null

  const video = (
    <video
      ref={videoRef}
      src={item.src}
      muted
      loop={!isPlaylist}
      playsInline
      preload="metadata"
      onEnded={() => setIndex((i) => (i + 1) % items.length)}
      className="h-full w-full object-cover"
    />
  )

  return (
    <div className="group relative my-2 w-full">
      <span className="corner-cross top-left" aria-hidden="true" />
      <span className="corner-cross bottom-right" aria-hidden="true" />
      <div className="card-border relative aspect-video w-full overflow-hidden rounded-lg bg-card">
        {item.href ? (
          <Link href={item.href} aria-label={item.title ? `View project: ${item.title}` : "View project"} className="block h-full w-full">
            {video}
            {item.title && (
              <span className="absolute bottom-4 left-4 rounded-sm bg-background px-2 py-1 text-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                {item.title} →
              </span>
            )}
          </Link>
        ) : (
          video
        )}
      </div>
    </div>
  )
}
