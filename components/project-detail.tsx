"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import type { Project, BlockType } from "@/db/schema"
import { ZoomTransition } from "@/components/zoom-transition"
import { useTransitionStore } from "@/stores/transition"
import { useHeaderStore } from "@/stores/header"
import { getBlobUrl } from "@/lib/config"

interface ProjectDetailProps {
  project: Project
}

function BlockRenderer({ block }: { block: BlockType }) {
  switch (block.type) {
    case "full-image":
      return (
        <div className="relative w-full overflow-hidden rounded-lg">
          <img
            src={block.url || "/placeholder.svg"}
            alt={block.alt || "Project image"}
            className="w-full h-auto"
          />
        </div>
      )

    case "two-column":
      return (
        <div className="grid grid-cols-2 gap-4 items-start">
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={block.left || "/placeholder.svg"}
              alt="Left image"
              className="w-full h-auto"
            />
          </div>
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={block.right || "/placeholder.svg"}
              alt="Right image"
              className="w-full h-auto"
            />
          </div>
        </div>
      )

    case "image-text":
      const ratioClasses = {
        "50-50": "grid-cols-2",
        "60-40": "grid-cols-[60fr_40fr]",
        "40-60": "grid-cols-[40fr_60fr]",
        "70-30": "grid-cols-[70fr_30fr]",
        "30-70": "grid-cols-[30fr_70fr]",
      }
      return (
        <div className={`grid ${ratioClasses[block.ratio]} gap-6 items-center`}>
          <div className={`relative overflow-hidden rounded-lg ${block.imagePosition === "right" ? "order-2" : ""}`}>
            <img
              src={block.image || "/placeholder.svg"}
              alt=""
              className="w-full h-auto"
            />
          </div>
          <div className={`prose prose-lg max-w-none ${block.imagePosition === "right" ? "order-1" : ""}`}>
            <p className="text-foreground whitespace-pre-wrap">{block.text}</p>
          </div>
        </div>
      )

    case "video":
      return (
        <div className="relative w-full overflow-hidden rounded-lg">
          <video
            src={block.url}
            className="w-full h-auto"
            autoPlay={block.autoplay ?? true}
            muted
            loop
            playsInline
          />
        </div>
      )

    case "text":
      return (
        <div className="prose prose-lg max-w-none">
          <p className="text-foreground whitespace-pre-wrap">{block.content}</p>
        </div>
      )

    case "heading":
      const HeadingTag = `h${block.level}` as "h1" | "h2" | "h3"
      const headingClasses = {
        1: "text-4xl font-bold",
        2: "text-3xl font-semibold",
        3: "text-2xl font-medium",
      }
      return (
        <HeadingTag className={headingClasses[block.level]}>
          {block.content}
        </HeadingTag>
      )

    case "quote":
      return (
        <blockquote className="border-l-4 border-foreground/20 pl-6 py-2">
          <p className="text-xl italic text-foreground/80">{block.content}</p>
          {block.author && (
            <cite className="mt-2 block text-sm text-muted-foreground not-italic">
              — {block.author}
            </cite>
          )}
        </blockquote>
      )

    default:
      return null
  }
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const firstImageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const setTargetPosition = useTransitionStore((state) => state.setTargetPosition)
  const clickedCard = useTransitionStore((state) => state.clickedCard)
  const phase = useTransitionStore((state) => state.phase)
  
  const { setProjectTitle, setProjectThumbnail, setShowProjectTitle, reset } = useHeaderStore()

  const blocks = (project.blocks as BlockType[]) || []
  const firstImageBlock = blocks.find(
    (b) => b.type === "full-image" || b.type === "two-column"
  )

  // Set project title/thumbnail and handle cleanup
  useEffect(() => {
    setProjectTitle(project.title)
    setProjectThumbnail(getBlobUrl(project.thumbnail) || null)
    
    return () => {
      reset()
    }
  }, [project.title, project.thumbnail, setProjectTitle, setProjectThumbnail, reset])

  // Track title visibility based on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!titleRef.current) return
      
      const titleRect = titleRef.current.getBoundingClientRect()
      // Header height is roughly 64px (h-16) on desktop, 56px (h-14) when scrolled
      const headerHeight = 64
      
      // Show project title in header when the title bottom edge passes behind the header
      const titleBehindHeader = titleRect.bottom < headerHeight
      setShowProjectTitle(titleBehindHeader)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Check initial state
    
    return () => window.removeEventListener("scroll", handleScroll)
  }, [setShowProjectTitle])

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

  const isFirstImageVisible = !clickedCard || phase === "zoom-out" || phase === "idle"

  return (
    <ZoomTransition>
      <div className="w-full px-4 py-12 md:px-8 lg:px-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back</span>
        </Link>

        <div className="mb-8">
          <h1 
            ref={titleRef}
            className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            {project.title}
          </h1>
        </div>

        <div className="space-y-8">
          {blocks.map((block, index) => {
            const isFirstImage =
              firstImageBlock &&
              ((block.type === "full-image" &&
                firstImageBlock.type === "full-image" &&
                block.url === firstImageBlock.url) ||
                (block.type === "two-column" &&
                  firstImageBlock.type === "two-column" &&
                  block.left === firstImageBlock.left))

            return (
              <div
                key={index}
                ref={isFirstImage ? firstImageRef : undefined}
                style={isFirstImage ? { opacity: isFirstImageVisible ? 1 : 0 } : undefined}
              >
                <BlockRenderer block={block} />
              </div>
            )
          })}

          {blocks.length === 0 && (
            <p className="text-muted-foreground">No content blocks yet.</p>
          )}
        </div>
      </div>
    </ZoomTransition>
  )
}
