"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import type { Project, BlockType } from "@/db/schema"
import { ZoomTransition } from "@/components/zoom-transition"
import { useTransitionStore } from "@/stores/transition"

interface ProjectDetailProps {
  project: Project
}

function BlockRenderer({ block }: { block: BlockType }) {
  switch (block.type) {
    case "full-image":
      return (
        <div className="relative w-full overflow-hidden rounded-lg">
          <div className="relative aspect-video w-full">
            <img
              src={block.url || "/placeholder.svg"}
              alt={block.alt || "Project image"}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )

    case "two-column":
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <img
              src={block.left || "/placeholder.svg"}
              alt="Left image"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <img
              src={block.right || "/placeholder.svg"}
              alt="Right image"
              className="h-full w-full object-cover"
            />
          </div>
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
  const setTargetPosition = useTransitionStore((state) => state.setTargetPosition)
  const clickedCard = useTransitionStore((state) => state.clickedCard)
  const phase = useTransitionStore((state) => state.phase)

  const blocks = (project.blocks as BlockType[]) || []
  const firstImageBlock = blocks.find(
    (b) => b.type === "full-image" || b.type === "two-column"
  )

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
          className="mb-8 inline-flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to projects</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
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
