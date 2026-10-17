import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

interface TextHighlightProps {
  children: ReactNode
  /** CSS colour of the marker */
  color: string
  delay?: number
  className?: string
}

// Marker-style highlight that sweeps in behind the text (after @animbits/text-highlight on 21st.dev).
// Drawn as an inline background so it follows the text when a keyword wraps across lines.
export function TextHighlight({ children, color, delay = 0, className }: TextHighlightProps) {
  const reduce = usePrefersReducedMotion()
  return (
    <motion.span
      className={cn('rounded-[3px] bg-no-repeat [box-decoration-break:clone] [-webkit-box-decoration-break:clone]', className)}
      style={{ backgroundImage: `linear-gradient(${color}, ${color})`, backgroundPosition: '0 90%' }}
      initial={reduce ? false : { backgroundSize: '0% 60%' }}
      animate={{ backgroundSize: '100% 60%' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.span>
  )
}
