"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import type { Project } from "@/lib/types"
import { getBlobUrl } from "@/lib/config"
import { ZoomTransition } from "@/components/zoom-transition"
import { useTransitionStore } from "@/stores/transition"

interface ProjectDetailProps {
  project: Project
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const firstImageRef = useRef<HTMLDivElement>(null)
  const setTargetPosition = useTransitionStore((state) => state.setTargetPosition)
  const clickedCard = useTransitionStore((state) => state.clickedCard)
  const phase = useTransitionStore((state) => state.phase)

  useEffect(() => {
    if (clickedCard && firstImageRef.current) {
      requestAnimationFrame(() => {
        if (firstImageRef.current) {
          const rect = firstImageRef.current.getBoundingClientRect()
          setTargetPosition({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          })
        }
      })
    }
  }, [clickedCard, setTargetPosition])

  // First image visible during zoom-out (underneath transition) for seamless handoff
  const isFirstImageVisible = !clickedCard || phase === "zoom-out" || phase === "idle"

  return (
    <ZoomTransition>
      <div className="w-full px-4 py-12 md:px-8 lg:px-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to projects</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">{project.title}</h1>
          {project.content.description && (
            <p className="mt-4 text-lg text-muted-foreground">
              {project.content.description}
            </p>
          )}
        </div>

        <div className="space-y-8">
          {project.images.map((image, index) => (
            <div 
              key={index} 
              ref={index === 0 ? firstImageRef : undefined}
              className="relative w-full overflow-hidden rounded-lg"
              style={index === 0 ? { opacity: isFirstImageVisible ? 1 : 0 } : undefined}
            >
              <div className="relative aspect-video w-full">
                <img
                  src={getBlobUrl(image) || "/placeholder.svg"}
                  alt={`${project.title} - Image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ))}

          {project.content.text && (
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground">{project.content.text}</p>
            </div>
          )}
        </div>
      </div>
    </ZoomTransition>
  )
}

