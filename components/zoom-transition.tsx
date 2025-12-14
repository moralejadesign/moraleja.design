"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTransitionStore } from "@/stores/transition"

interface ZoomTransitionProps {
  children: React.ReactNode
}

export function ZoomTransition({ children }: ZoomTransitionProps) {
  const clickedCard = useTransitionStore((state) => state.clickedCard)
  const targetPosition = useTransitionStore((state) => state.targetPosition)
  const phase = useTransitionStore((state) => state.phase)
  const setClickedCard = useTransitionStore((state) => state.setClickedCard)
  const setTargetPosition = useTransitionStore((state) => state.setTargetPosition)
  const setPhase = useTransitionStore((state) => state.setPhase)
  
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (clickedCard && typeof window !== "undefined") {
      setPhase("zoom-in")
      setShowContent(false)
      window.scrollTo({ top: 0, behavior: "instant" })
      
      // Phase 1: Zoom in completes, start zoom out
      const zoomOutTimer = setTimeout(() => {
        setPhase("zoom-out")
        setShowContent(true)
      }, 550)
      
      // Clean up
      const cleanupTimer = setTimeout(() => {
        setPhase("idle")
        setClickedCard(null)
        setTargetPosition(null)
      }, 1000)

      return () => {
        clearTimeout(zoomOutTimer)
        clearTimeout(cleanupTimer)
      }
    } else if (!clickedCard) {
      setShowContent(true)
    }
  }, [clickedCard, setClickedCard, setPhase, setTargetPosition])

  const getAnimationState = useCallback(() => {
    if (!clickedCard) return null
    
    const initialPos = { x: clickedCard.x, y: clickedCard.y }
    
    // Default target (center-ish of where first image would be)
    const defaultTarget = {
      x: 16,
      y: 200,
      width: typeof window !== "undefined" ? window.innerWidth - 32 : 800,
      height: typeof window !== "undefined" ? (window.innerWidth - 32) * 0.5625 : 450, // 16:9
    }
    
    const target = targetPosition || defaultTarget
    
    if (phase === "zoom-in") {
      return {
        container: {
          initial: { x: initialPos.x, y: initialPos.y, width: clickedCard.width, height: clickedCard.height },
          animate: { x: 0, y: 0, width: "100vw", height: "100vh" },
        },
        image: {
          initial: { scale: 1 },
          animate: { scale: 1.15 },
        },
      }
    }
    
    if (phase === "zoom-out") {
      return {
        container: {
          initial: { x: 0, y: 0, width: "100vw", height: "100vh" },
          animate: { 
            x: target.x, 
            y: target.y, 
            width: target.width, 
            height: target.height,
            borderRadius: 8,
          },
        },
        image: {
          initial: { scale: 1.15 },
          animate: { scale: 1 },
        },
      }
    }
    
    return null
  }, [clickedCard, targetPosition, phase])

  if (!clickedCard) {
    return <>{children}</>
  }

  const animState = getAnimationState()

  return (
    <>
      <AnimatePresence>
        {phase !== "idle" && animState && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute bg-background overflow-hidden"
              initial={animState.container.initial}
              animate={animState.container.animate}
              transition={{
                duration: phase === "zoom-in" ? 0.55 : 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {clickedCard.imageUrl && (
                <motion.div
                  className="absolute inset-0"
                  initial={animState.image.initial}
                  animate={animState.image.animate}
                  transition={{
                    duration: phase === "zoom-in" ? 0.55 : 0.35,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <img
                    src={clickedCard.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ opacity: showContent ? 1 : 0 }}>
        {children}
      </div>
    </>
  )
}

