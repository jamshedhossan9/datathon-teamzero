import { ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { APP_NAME } from '@/lib/constants'

interface RevealIntroProps {
  onDone: () => void
}

// Cream curtain with the logo that wipes upward to reveal the page (~1.2 s).
export function RevealIntro({ onDone }: RevealIntroProps) {
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    if (reduce) onDone()
  }, [reduce, onDone])

  if (reduce) return null

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      initial={{ clipPath: 'inset(0 0 0 0)' }}
      animate={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.7, delay: 0.55, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={onDone}
    >
      <motion.div
        className="flex items-center gap-3 text-foreground"
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <ShieldCheck className="size-10 text-primary" strokeWidth={1.75} />
        <span className="font-display text-4xl">{APP_NAME}</span>
      </motion.div>
    </motion.div>
  )
}
