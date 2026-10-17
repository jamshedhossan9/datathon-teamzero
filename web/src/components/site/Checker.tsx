import { AlertCircle, Loader2, RotateCcw, ScanSearch } from 'lucide-react'
import { useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { ResultPanel } from '@/components/site/ResultPanel'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EXAMPLES } from '@/data/examples'
import { checkMessage } from '@/lib/api'
import { MAX_CHARS } from '@/lib/constants'
import type { CheckResult } from '@/lib/types'
import { cn } from '@/lib/utils'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; text: string; result: CheckResult }
  | { status: 'error'; text: string }

export function Checker() {
  const [text, setText] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const latest = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const reduce = usePrefersReducedMotion()

  // Bring the message box up to just under the fixed top bar, so the result appears right below it
  function scrollToForm() {
    formRef.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const length = Array.from(text).length
  const tooLong = length > MAX_CHARS
  const canSubmit = text.trim().length > 0 && !tooLong

  async function submit(message: string) {
    controller.current?.abort()
    const ac = new AbortController()
    controller.current = ac
    const id = ++latest.current
    setState({ status: 'loading' })
    try {
      const result = await checkMessage(message, ac.signal)
      if (id === latest.current) setState({ status: 'done', text: message, result })
    } catch {
      if (id === latest.current) setState({ status: 'error', text: message })
    }
  }

  return (
    <div id="check" className="w-full max-w-3xl scroll-mt-28">
      <form
        className="scroll-mt-20 rounded-2xl border border-border bg-surface/90 p-3 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur-sm"
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim() && !tooLong) {
            scrollToForm()
            void submit(text)
          }
        }}
      >
        <label htmlFor="message" className="sr-only">
          Message to check
        </label>
        <Textarea
          id="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the SMS or chat message here…"
          aria-invalid={tooLong || undefined}
          className="max-h-72 min-h-28 resize-none border-0 bg-transparent px-3 text-base shadow-none focus-visible:ring-0 md:text-base"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
          <span className={cn('font-mono text-xs', tooLong ? 'text-scam' : 'text-muted-fg')}>
            {length} / {MAX_CHARS}
          </span>
          <Button type="submit" size="lg" disabled={!canSubmit} className="rounded-lg bg-gradient-to-b from-white via-white/95 to-white/60 px-5 text-black transition-transform duration-200 hover:scale-105 active:scale-95">
            {state.status === 'loading' ? <Loader2 className="animate-spin" /> : <ScanSearch />}
            Check message
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-muted-fg">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => setText(ex.text)}
            className="rounded-full border border-border bg-surface px-3 py-1 font-medium text-foreground transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {state.status === 'error' && (
        <div role="alert" className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-scam/30 bg-scam/5 px-4 py-3 text-sm text-foreground">
          <span className="flex items-center gap-2">
            <AlertCircle className="size-4 text-scam" />
            Couldn't check right now. Please try again in a moment.
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void submit(state.text)}>
            <RotateCcw /> Try again
          </Button>
        </div>
      )}

      {state.status === 'done' && <ResultPanel text={state.text} result={state.result} />}
    </div>
  )
}
