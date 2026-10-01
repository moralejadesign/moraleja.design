"use client"

import { useRef, type VideoHTMLAttributes } from "react"
import { useInViewVideo } from "@/hooks/use-in-view-video"

type LazyVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "autoPlay" | "preload"> & {
  /** Start playing when scrolled into view. Only honoured while muted, as browsers block unmuted autoplay. */
  autoplay?: boolean
}

/** Video that downloads nothing until needed and only plays while on screen. */
export function LazyVideo({ autoplay = true, muted = true, loop = true, ...props }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  useInViewVideo(ref, autoplay && muted)

  return (
    <video
      ref={ref}
      muted={muted}
      loop={loop}
      playsInline
      // Click-to-play videos still need a first frame, so fetch metadata for those.
      preload={autoplay && muted ? "none" : "metadata"}
      {...props}
    />
  )
}
