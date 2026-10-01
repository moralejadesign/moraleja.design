import { useEffect, type RefObject } from "react"

/** Most reels allowed to play at once; starting another pauses the oldest. */
const MAX_ACTIVE = 2

// Shared across every mounted video so the limit applies page-wide.
const active = new Set<HTMLVideoElement>()
const autoplayable = new WeakSet<HTMLVideoElement>()
let observer: IntersectionObserver | null = null

function enforceLimit(current: HTMLVideoElement) {
  active.add(current)
  if (active.size <= MAX_ACTIVE) return
  for (const video of active) {
    if (video === current) continue
    video.pause()
    active.delete(video)
    break
  }
}

function getObserver() {
  if (observer) return observer
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        const video = target as HTMLVideoElement
        if (!isIntersecting) {
          video.pause()
          active.delete(video)
          continue
        }
        if (reduceMotion || !autoplayable.has(video)) continue
        video
          .play()
          .then(() => enforceLimit(video))
          .catch(() => {})
      }
    },
    { rootMargin: "200px 0px", threshold: 0.1 }
  )
  return observer
}

/**
 * Plays a video only while it is near the viewport, pauses it when it leaves,
 * caps concurrent playback and honours reduced motion. With `autoplay` off the
 * video is still paused when scrolled away, but never started automatically.
 */
export function useInViewVideo(ref: RefObject<HTMLVideoElement | null>, autoplay = true) {
  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (autoplay) autoplayable.add(video)
    const io = getObserver()
    io.observe(video)
    return () => {
      io.unobserve(video)
      autoplayable.delete(video)
      active.delete(video)
    }
  }, [ref, autoplay])
}
