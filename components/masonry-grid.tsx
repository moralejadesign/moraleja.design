"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type Masonry from "masonry-layout"
import type { Project } from "@/lib/projects"
import { getBlobUrl } from "@/lib/config"
import { useTransitionStore } from "@/stores/transition"

function AnimatedNumber({ value, isVisible }: { value: number; isVisible: boolean }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    if (!isVisible) {
      setDisplayValue(0)
      return
    }
    
    const duration = 400
    const steps = 20
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.round(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value, isVisible])
  
  return <span>{displayValue}</span>
}

interface CardItemProps {
  project: Project
  isMobile: boolean
  isHovered: boolean
  onHover: (hovered: boolean) => void
  onClick: (rect: DOMRect, imageUrl: string) => void
  onImageLoad: () => void
}

function CardItem({ project, isMobile, isHovered, onHover, onClick, onImageLoad }: CardItemProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const cardHeight = Math.round(project.heightRatio * (isMobile ? 150 : 250))

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) })
    }
  }, [isHovered])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const imageElement = cardRef.current.querySelector('img')
    onClick(rect, imageElement?.src || getBlobUrl(project.thumbnail) || "")
  }

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="grid-item group relative mb-4 block w-[calc(50%-8px)] cursor-pointer overflow-visible transition-all duration-300 hover:scale-[1.02] md:mb-6 md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Corner crosses - Geist style */}
      <span className="corner-cross top-left" aria-hidden="true" />
      <span className="corner-cross bottom-right" aria-hidden="true" />
      
      {/* Dimension labels - Figma style */}
      <span 
        className={`absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground/50 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        }`}
        aria-hidden="true"
      >
        <AnimatedNumber value={dimensions.width} isVisible={isHovered} />
      </span>
      <span 
        className={`absolute -right-4 top-1/2 -translate-y-1/2 rotate-90 font-mono text-[10px] text-muted-foreground/50 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
        }`}
        aria-hidden="true"
      >
        <AnimatedNumber value={dimensions.height} isVisible={isHovered} />
      </span>
      
      <div className="card-border relative w-full overflow-hidden" style={{ height: `${cardHeight}px` }}>
        <img
          src={getBlobUrl(project.thumbnail) || "/placeholder.svg"}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onLoad={onImageLoad}
        />

        <div
          className={`absolute inset-0 bg-black/0 transition-all duration-300 ${
            isHovered ? "bg-black/20" : ""
          }`}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 lg:p-6">
        <h2 
          className={`text-xs font-semibold tracking-wide md:text-sm lg:text-base ${
            project.textContrast === "dark" ? "text-gray-900" : "text-white"
          }`}
        >
          {project.title}
        </h2>
      </div>
    </div>
  )
}

interface MasonryGridProps {
  projects: Project[]
}

export function MasonryGrid({ projects }: MasonryGridProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLDivElement>(null)
  const masonryRef = useRef<Masonry | null>(null)
  const router = useRouter()
  const setClickedCard = useTransitionStore((state) => state.setClickedCard)

  const relayout = useCallback(() => {
    if (masonryRef.current && typeof masonryRef.current.layout === 'function') {
      masonryRef.current.layout()
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || !sizerRef.current) return

    let masonryInstance: Masonry | null = null

    const getGutter = () => {
      if (typeof window === "undefined") return 16
      return window.innerWidth >= 768 ? 24 : 16
    }

    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }

    const initMasonry = async () => {
      const MasonryModule = await import("masonry-layout")
      const Masonry = MasonryModule.default

      const instance = new Masonry(containerRef.current!, {
        itemSelector: ".grid-item",
        columnWidth: sizerRef.current,
        gutter: getGutter(),
        percentPosition: true,
        transitionDuration: 0,
      })

      masonryInstance = instance
      masonryRef.current = instance
      if (instance && typeof instance.layout === 'function') {
        instance.layout()
      }
      
      checkMobile()
      requestAnimationFrame(() => {
        setIsReady(true)
      })
    }

    initMasonry()

    const handleResize = () => {
      checkMobile()
      if (masonryRef.current) {
        (masonryRef.current as Masonry & { options: { gutter: number } }).options.gutter = getGutter()
        if (typeof masonryRef.current.layout === 'function') {
          masonryRef.current.layout()
        }
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

  // Relayout when isMobile changes (card heights change)
  useEffect(() => {
    relayout()
  }, [isMobile, relayout])

  return (
    <div className="w-full px-3 py-8 md:px-8 md:py-12 lg:px-12">
      <div 
        ref={containerRef} 
        className={`masonry-container transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`}
      >
        <div ref={sizerRef} className="grid-sizer invisible absolute w-[calc(50%-8px)] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]" />
        {projects.map((project) => (
          <CardItem
            key={project.id}
            project={project}
            isMobile={isMobile}
            isHovered={hoveredId === project.id}
            onHover={(hovered) => setHoveredId(hovered ? project.id : null)}
            onClick={(rect, imageUrl) => {
              setClickedCard({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                imageUrl,
              })
              setTimeout(() => router.push(`/project/${project.slug}`), 0)
            }}
            onImageLoad={relayout}
          />
        ))}
      </div>
    </div>
  )
}
