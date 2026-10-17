import { Inbox as InboxIcon, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ResultPanel } from '@/components/site/ResultPanel'
import { Button } from '@/components/ui/button'
import { checkMessage, getDemoMessages } from '@/lib/api'
import type { CheckResult, DemoMessage, Verdict } from '@/lib/types'
import { cn } from '@/lib/utils'

// Live inbox demo (step 412): made-up messages arrive one by one and are checked on IBM LinuxONE as they land.
const ARRIVAL_MS = 3000

type Item = DemoMessage & { result?: CheckResult; failed?: boolean }

const BADGE: Record<Verdict, { label: string; className: string }> = {
  scam: { label: '🚨 Scam', className: 'border-scam/30 bg-scam/10 text-scam' },
  suspicious: { label: '⚠️ Suspicious', className: 'border-suspicious/30 bg-suspicious/10 text-suspicious' },
  legit: { label: '✅ Safe', className: 'border-legit/30 bg-legit/10 text-legit' },
}

export function Inbox() {
  const [items, setItems] = useState<Item[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const ac = new AbortController()
    let timer: ReturnType<typeof setInterval> | undefined
    setItems([])
    setSelectedId(null)

    getDemoMessages(ac.signal).then(
      (all) => {
        let next = 0
        const arrive = () => {
          if (next >= all.length) return clearInterval(timer)
          const msg = all[next++]
          setItems((prev) => [{ ...msg }, ...prev]) // newest first
          checkMessage(msg.message, ac.signal).then(
            (result) => setItems((prev) => prev.map((it) => (it.id === msg.id ? { ...it, result } : it))),
            () => {
              if (!ac.signal.aborted) setItems((prev) => prev.map((it) => (it.id === msg.id ? { ...it, failed: true } : it)))
            },
          )
        }
        arrive()
        timer = setInterval(arrive, ARRIVAL_MS)
      },
      () => {},
    )
    return () => {
      ac.abort()
      clearInterval(timer)
    }
  }, [run])

  const selected = items.find((it) => it.id === selectedId)

  return (
    <section className="px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-5xl">
            Live inbox demo
          </h1>
          <p className="mt-2 text-muted-fg">Messages arrive one by one and are checked in real time by our AI on IBM LinuxONE.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-fg">
            <Button type="button" variant="outline" size="sm" onClick={() => setRun((r) => r + 1)}>
              <RotateCcw /> Restart demo
            </Button>
            <span>Demo messages are made up; names and numbers are not real.</span>
          </div>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,380px)_1fr]">
          {/* Phone frame: stays in view on wide screens while the details scroll */}
          <div className="mx-auto w-full max-w-[380px] rounded-[2.5rem] border border-white/15 bg-[#0a0a0a] p-3 shadow-2xl lg:sticky lg:top-24">
            {/* The rounded wrapper clips the scrollbar's corners; the inner box scrolls */}
            <div className="h-[620px] overflow-hidden rounded-[2rem] border border-border bg-surface">
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-surface/95 px-4 py-3 font-semibold backdrop-blur">
                <InboxIcon className="size-4 text-muted-fg" /> Messages
              </div>
              {items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  data-testid="inbox-message"
                  onClick={() => setSelectedId(it.id)}
                  className={cn(
                    'block w-full animate-in fade-in slide-in-from-top-2 border-b border-border px-4 py-3 text-left transition-colors duration-200 hover:bg-background/60',
                    it.id === selectedId && 'bg-background/80',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-semibold text-foreground">{it.sender}</span>
                    {it.result ? (
                      <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium', BADGE[it.result.verdict].className)}>
                        {BADGE[it.result.verdict].label}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-fg">{it.failed ? 'error' : 'checking…'}</span>
                    )}
                  </div>
                  <p className="mt-1 break-words text-sm text-muted-fg [overflow-wrap:anywhere]">{it.message}</p>
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* Details of the tapped message */}
          {/* [&>section]:mt-0 lines the result card up with the top of the phone */}
          <div className="min-w-0 [&>section]:mt-0">
            {selected?.result ? (
              <ResultPanel text={selected.message} result={selected.result} explain={false} from={selected.sender} />
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-6 text-muted-fg">Tap a message to see why it got its label.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
