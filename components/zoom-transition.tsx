"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTransitionStore } from "@/stores/transition"

const ANIMATION_DURATION = 0.35 // 350ms total

interface ZoomTransitionProps {
  children: React.ReactNode
}

export function ZoomTransition({ children }: ZoomTransitionProps) {
  const clickedCard = useTransitionStore((state) => state.clickedCard)
  const targetPosition = useTransitionStore((state) => state.targetPosition)
  const reset = useTransitionStore((state) => state.reset)
  
  const [showOverlay, setShowOverlay] = useState(false)
  const animationRef = useRef<number | null>(null)

  // useLayoutEffect runs synchronously before paint, preventing flicker
  useLayoutEffect(() => {
    if (clickedCard) {
      window.scrollTo({ top: 0, behavior: "instant" })
      setShowOverlay(true)
    }
  }, [clickedCard])

  useEffect(() => {
    if (clickedCard) {
      // Clean up animation after it completes
      animationRef.current = window.setTimeout(() => {
        setShowOverlay(false)
        reset()
      }, ANIMATION_DURATION * 1000 + 50) // Small buffer for safety
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [clickedCard, reset])

  // Calculate target dimensions - use actual target if available, else smart defaults
  const getTarget = () => {
    if (targetPosition) return targetPosition
    
    // Default: full-width image area below title
    const padding = typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 48
    const width = typeof window !== "undefined" ? window.innerWidth - padding * 2 : 800
    return {
      x: padding,
      y: 200, // Below back button + title
      width,
      height: width * 0.5625, // 16:9 aspect ratio
    }
  }

  if (!clickedCard) {
    return <>{children}</>
  }

  const target = getTarget()
  
  // After scrolling to top, adjust the starting Y position to account for where
  // the card was in document space (viewport position + scroll offset at click time)
  const initialY = clickedCard.y + clickedCard.scrollOffset

  return (
    <>
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="absolute overflow-hidden"
              style={{ borderRadius: 8 }}
              initial={{
                x: clickedCard.x,
                y: initialY,
                width: clickedCard.width,
                height: clickedCard.height,
              }}
              animate={{
                x: target.x,
                y: target.y,
                width: target.width,
                height: target.height,
                borderRadius: 8,
              }}
              transition={{
                duration: ANIMATION_DURATION,
                ease: [0.32, 0.72, 0, 1], // Custom ease for snappy feel
              }}
            >
              {clickedCard.imageUrl && (
                <motion.img
                  src={clickedCard.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content fades in immediately, overlapping with animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.25,
          delay: 0.1, // Start fading in shortly after animation begins
        }}
      >
        {children}
      </motion.div>
    </>
  )
}
