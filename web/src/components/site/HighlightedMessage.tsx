import { TextHighlight } from '@/components/ui/text-highlight'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { buildSpans } from '@/lib/spans'
import type { Keyword } from '@/lib/types'

const MARKER = {
  fraud: 'color-mix(in oklab, var(--scam) 22%, transparent)',
  legit: 'color-mix(in oklab, var(--legit) 22%, transparent)',
}

interface HighlightedMessageProps {
  text: string
  keywords: Keyword[]
}

export function HighlightedMessage({ text, keywords }: HighlightedMessageProps) {
  const spans = buildSpans(text, keywords)
  let order = 0
  return (
    <TooltipProvider delayDuration={100}>
      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-base leading-relaxed text-foreground">
        {spans.map((span, i) => {
          const k = span.keyword
          if (!k) return <span key={i}>{span.text}</span>
          const label = `${k.direction === 'fraud' ? 'Scam signal' : 'Legitimate signal'}: ${k.reason}`
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  data-direction={k.direction}
                  aria-label={`${span.text} — ${label}`}
                  className="cursor-help rounded-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TextHighlight color={MARKER[k.direction]} delay={0.15 + order++ * 0.08}>
                    {span.text}
                  </TextHighlight>
                </span>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          )
        })}
      </p>
    </TooltipProvider>
  )
}
