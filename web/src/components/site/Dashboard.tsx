import { LayoutDashboard } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { KpiTiles } from '@/components/site/KpiTiles'
import { TopCountries } from '@/components/site/TopCountries'
import { TopKeywords } from '@/components/site/TopKeywords'
import { WorldFraudMap } from '@/components/site/WorldFraudMap'
import { getStats } from '@/lib/api'
import type { Stats } from '@/lib/types'
import { loadWorldData } from '@/lib/worldData'

export function Dashboard() {
  const world = useMemo(() => loadWorldData(), [])
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    getStats(ac.signal).then(setStats, () => setStats(null))
    return () => ac.abort()
  }, [])

  const sources = useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of [...world.countries, ...world.global]) if (!seen.has(e.source)) seen.set(e.source, e.url)
    return [...seen]
  }, [world])

  return (
    <section id="dashboard" className="scroll-mt-24 px-4 pb-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-5xl">The scam landscape</h2>
          <p className="mt-2 text-muted-fg">How well our checker works, and where scams hurt most worldwide.</p>
        </div>

        {/* "App window" frame — takes the place of the template's dashboard screenshot, with its warm horizon glow */}
        <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[90%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgb(251_146_60/0.45),rgb(234_88_12/0.15)_45%,transparent_70%)] blur-2xl"
        />
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border bg-surface/80 px-4 py-3">
            <span className="size-3 rounded-full bg-scam/60" />
            <span className="size-3 rounded-full bg-highlight/70" />
            <span className="size-3 rounded-full bg-legit/60" />
            <span className="ml-3 flex items-center gap-1.5 font-mono text-xs text-muted-fg">
              <LayoutDashboard className="size-3.5" /> zeroscam / dashboard
            </span>
          </div>

          <div className="space-y-4 p-4 md:p-6">
            <KpiTiles stats={stats} global={world.global} />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <WorldFraudMap countries={world.countries} />
              </div>
              <TopCountries countries={world.countries} limit={10} />
            </div>
            <TopKeywords items={stats?.top_keywords ?? []} />
          </div>
        </div>
        </div>

        <p data-testid="source-line" className="mt-4 text-center text-xs leading-relaxed text-muted-fg">
          Sources:{' '}
          {sources.map(([name, url], i) => (
            <span key={name}>
              <a href={url} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-2 hover:text-primary">
                {name}
              </a>
              {i < sources.length - 1 && ' · '}
            </span>
          ))}
          . Countries without a published figure are left unshaded.
        </p>
      </div>
    </section>
  )
}
