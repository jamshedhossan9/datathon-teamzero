import { ArrowDown, Cpu } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ShinyButton } from '@/components/ui/shiny-button'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { APP_NAME, HEADLINE, SUBLINE } from '@/lib/constants'

interface HeroProps {
  /** start the entrance animation (after the reveal intro) */
  play: boolean
  children: ReactNode
}

// Hierarchy, gradient title and gradient CTA follow the 21st.dev SaaS template hero.
export function Hero({ play, children }: HeroProps) {
  const reduce = usePrefersReducedMotion()
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: play ? { opacity: 1, y: 0 } : undefined,
          transition: { duration: 0.6, delay, ease: [0.25, 1, 0.5, 1] as const },
        }

  return (
    <section id="top" className="relative flex flex-col items-center px-6 pb-12 pt-32 md:pt-36">
      <motion.p {...rise(0)} className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-muted-fg">
        IBM Z Datathon 2026
      </motion.p>

      <motion.h1
        {...rise(0.1)}
        className="mb-4 bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-center font-display text-6xl leading-none tracking-tight text-transparent sm:text-7xl lg:text-8xl"
      >
        {APP_NAME}
      </motion.h1>

      <motion.p {...rise(0.25)} className="mb-3 max-w-3xl text-center text-xl font-medium text-white/90 sm:text-2xl">
        {HEADLINE}
      </motion.p>

      <motion.p {...rise(0.35)} className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-fg">
        <Cpu className="size-4" />
        <span className="text-sm">{SUBLINE}</span>
      </motion.p>

      <motion.p {...rise(0.45)} className="mb-10 max-w-xl text-center text-sm text-muted-fg md:text-base">
        Paste any suspicious SMS or chat message. We check it in milliseconds — nothing is stored.
      </motion.p>

      <motion.div {...rise(0.55)} className="flex w-full justify-center">
        {children}
      </motion.div>

      <motion.div {...rise(0.65)} className="mt-12">
        <ShinyButton href="#dashboard">
          See the scam landscape <ArrowDown className="size-4" />
        </ShinyButton>
      </motion.div>
    </section>
  )
}
