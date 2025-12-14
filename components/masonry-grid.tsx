"use client"

import { ArrowUpRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import type Masonry from "masonry-layout"
import { projects } from "@/lib/projects"
import { getBlobUrl } from "@/lib/config"

export function MasonryGrid() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLDivElement>(null)
  const masonryRef = useRef<Masonry | null>(null)

  useEffect(() => {
    if (!containerRef.current || !sizerRef.current) return

    let masonryInstance: Masonry | null = null

    const initMasonry = async () => {
      const MasonryModule = await import("masonry-layout")
      const Masonry = MasonryModule.default

      const instance = new Masonry(containerRef.current!, {
        itemSelector: ".grid-item",
        columnWidth: sizerRef.current,
        gutter: 24,
        percentPosition: true,
        transitionDuration: 0,
      })

      masonryInstance = instance
      masonryRef.current = instance
      if (instance && typeof instance.layout === 'function') {
        instance.layout()
      }
      
      requestAnimationFrame(() => {
        setIsReady(true)
      })
    }

    initMasonry()

    const handleResize = () => {
      if (masonryRef.current && typeof masonryRef.current.layout === 'function') {
        masonryRef.current.layout()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (masonryInstance && typeof masonryInstance.destroy === 'function') {
        masonryInstance.destroy()
      }
      masonryRef.current = null
    }
  }, [])

  useEffect(() => {
    if (masonryRef.current && typeof masonryRef.current.layout === 'function') {
      masonryRef.current.layout()
    }
  }, [hoveredId])

  return (
    <div className="w-full px-4 py-12 md:px-8 lg:px-12">
      <div 
        ref={containerRef} 
        className={`masonry-container transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`}
      >
        <div ref={sizerRef} className="grid-sizer invisible absolute w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]" />
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/project/${project.slug}`}
            className="grid-item group relative mb-6 block w-full overflow-hidden rounded-lg bg-muted transition-all duration-300 hover:scale-[1.02] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative w-full overflow-hidden" style={{ height: `${project.heightRatio * 250}px` }}>
              <img
                src={getBlobUrl(project.thumbnail) || "/placeholder.svg"}
                alt={project.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onLoad={() => {
                  if (masonryRef.current && typeof masonryRef.current.layout === 'function') {
                    masonryRef.current.layout()
                  }
                }}
              />

              <div
                className={`absolute inset-0 bg-black/0 transition-all duration-300 ${
                  hoveredId === project.id ? "bg-black/20" : ""
                }`}
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 md:p-6">
              <h2 className="text-sm font-semibold tracking-wide text-foreground md:text-base">{project.title}</h2>
              <ArrowUpRight
                className={`h-5 w-5 text-foreground transition-all duration-300 md:h-6 md:w-6 ${
                  hoveredId === project.id ? "translate-x-1 -translate-y-1 opacity-100" : "opacity-60"
                }`}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
