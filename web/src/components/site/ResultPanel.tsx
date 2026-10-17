import NumberFlow from '@number-flow/react'
import { AlertTriangle, Bot, CheckCircle2, Cpu, CreditCard, ShieldAlert, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { HighlightedMessage } from '@/components/site/HighlightedMessage'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Badge } from '@/components/ui/badge'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { explainMessage } from '@/lib/api'
import type { CheckResult, Explanation, Payee, Verdict } from '@/lib/types'
import { cn } from '@/lib/utils'
import { VERDICT_LABEL } from '@/lib/verdict'

const STYLE: Record<Verdict, { icon: typeof ShieldAlert; color: string; tint: string; text: string }> = {
  scam: { icon: ShieldAlert, color: 'var(--scam)', tint: 'bg-scam/8 border-scam/30', text: 'text-scam' },
  suspicious: { icon: AlertTriangle, color: 'var(--suspicious)', tint: 'bg-suspicious/8 border-suspicious/30', text: 'text-suspicious' },
  legit: { icon: CheckCircle2, color: 'var(--legit)', tint: 'bg-legit/8 border-legit/30', text: 'text-legit' },
}

interface ResultPanelProps {
  text: string
  result: CheckResult
  /** ask IBM Granite for a plain-language explanation (off in the inbox demo, to keep it fast) */
  explain?: boolean
  /** sender shown on the right of the title (inbox demo) */
  from?: string
}

/** Who gets the money on a payment link (read from the payment page by our server). */
function PayeeBanner({ payee }: { payee: Payee }) {
  const warn = payee.mismatch || !payee.receiver
  return (
    <div
      data-testid="payee"
      className={cn(
        'flex items-start gap-2 border-b px-5 py-3 text-sm font-medium',
        warn ? 'border-suspicious/30 bg-suspicious/10 text-suspicious' : 'border-border bg-background/60 text-foreground',
      )}
    >
      <CreditCard className="mt-0.5 size-4 shrink-0" />
      <span>
        Payment goes to: <strong>{payee.receiver ?? "couldn't verify"}</strong>
        {payee.mismatch && payee.claimed_sender && <> (but the message claims to be from {payee.claimed_sender})</>}
      </span>
    </div>
  )
}

/** IBM Granite's explanation, fetched after the result is shown; never left empty. */
function GraniteBox({ text }: { text: string }) {
  const [answer, setAnswer] = useState<Explanation | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    setAnswer(null)
    explainMessage(text, ac.signal).then(setAnswer, () => {
      if (!ac.signal.aborted) setAnswer({ text: "Sorry, the AI explanation couldn't be loaded. The checks above still apply.", source: 'fallback' })
    })
    return () => ac.abort()
  }, [text])

  const fromGranite = answer?.source === 'granite'
  return (
    <div
      data-testid="granite-box"
      className={cn('mt-3 rounded-xl border p-3 text-sm', fromGranite || !answer ? 'border-violet-400/30 bg-violet-500/10' : 'border-border bg-background/60 text-muted-fg')}
    >
      <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
        <Bot className="size-4 text-violet-300" /> AI explanation (IBM Granite on LinuxONE)
      </p>
      <p className="leading-relaxed">{answer ? answer.text : 'Writing an explanation…'}</p>
    </div>
  )
}

export function ResultPanel({ text, result, explain = true, from }: ResultPanelProps) {
  const reduce = usePrefersReducedMotion()
  const s = STYLE[result.verdict]
  const Icon = s.icon
  const percent = Math.round(result.scam_probability * 100)
  const chips = [...result.keywords].sort((a, b) => b.weight - a.weight)

  return (
    <motion.section
      data-verdict={result.verdict}
      aria-live="polite"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-[0_10px_40px_-12px_rgb(0_0_0/0.6)]"
    >
      <div className={cn('flex items-center justify-between gap-3 border-b px-5 py-4', s.tint)}>
        <div className="flex items-center gap-3">
          <Icon className={cn('size-7', s.text)} strokeWidth={2} />
          <h2 className={cn('text-2xl font-semibold tracking-tight', s.text)}>{VERDICT_LABEL[result.verdict]}</h2>
        </div>
        {from && <span data-testid="from" className="truncate text-sm text-muted-fg">From: {from}</span>}
        {result.mock && (
          <Badge variant="outline" className="border-highlight/50 bg-highlight/10 font-mono text-[11px] uppercase tracking-wider text-suspicious">
            Demo mode
          </Badge>
        )}
      </div>

      {result.payee && <PayeeBanner payee={result.payee} />}

      <div className="grid gap-6 p-5 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <div data-testid="scam-gauge">
            <AnimatedCircularProgressBar
              value={percent}
              gaugePrimaryColor={s.color}
              gaugeSecondaryColor="color-mix(in oklab, var(--border) 70%, transparent)"
              className="size-36 font-mono text-3xl text-foreground"
            />
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-fg">Scam likelihood %</span>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <HighlightedMessage text={text} keywords={result.keywords} />
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.length === 0 ? (
              <span className="text-sm text-muted-fg">No specific keywords flagged</span>
            ) : (
              chips.map((k, i) => (
                <span
                  key={i}
                  data-testid="keyword-chip"
                  title={k.reason}
                  className={cn(
                    'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    k.direction === 'fraud' ? 'border-scam/30 bg-scam/8 text-scam' : 'border-legit/30 bg-legit/8 text-legit',
                  )}
                >
                  <span className="truncate">{k.text}</span>
                  <span className="font-mono opacity-70">{k.direction === 'fraud' ? '+' : '−'}{Math.round(k.weight * 100)}</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-t border-border px-5 py-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-fg">
            <Sparkles className="size-4 text-highlight" /> Why
          </h3>
          <p className="text-sm leading-relaxed text-foreground">{result.explanation}</p>
          {explain && !result.mock && <GraniteBox text={text} />}
          {result.reasons && result.reasons.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wider text-muted-fg">What we found</h3>
              <ul className="space-y-1.5 text-sm text-foreground">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-fg" />
                    {r}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div>
          <h3 id="advice-heading" className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-fg">
            What to do
          </h3>
          <ul aria-labelledby="advice-heading" className="space-y-1.5 text-sm text-foreground">
            {result.advice.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className={cn('mt-2 size-1.5 shrink-0 rounded-full', result.verdict === 'legit' ? 'bg-legit' : 'bg-scam')} />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-border bg-background/50 px-5 py-3 font-mono text-xs text-muted-fg">
        <Cpu className="size-3.5" />
        <span>
          Checked in{' '}
          <strong data-testid="latency" className="text-foreground">
            <span className="sr-only">{result.latency_ms}</span>
            <span aria-hidden>
              <NumberFlow value={result.latency_ms} />
            </span>{' '}
            ms
          </strong>{' '}
          {result.mock ? 'with demo rules in your browser' : 'on IBM LinuxONE'} · message not stored
        </span>
      </div>

      {result.masked_message && (
        <div className="border-t border-border px-5 py-3 text-xs text-muted-fg">
          <p className="mb-1 font-semibold uppercase tracking-wider">What our server processed (personal data masked)</p>
          <p className="break-words font-mono [overflow-wrap:anywhere]">{result.masked_message}</p>
        </div>
      )}
    </motion.section>
  )
}
