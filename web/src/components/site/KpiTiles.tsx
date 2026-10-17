import { Globe2, MessageSquareText, ShieldAlert, type LucideIcon } from 'lucide-react'
import type { Stats } from '@/lib/types'
import type { GlobalFigure } from '@/lib/worldData'

const usd = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 })
const count = new Intl.NumberFormat('en')

// Tinted icon tile, as in the template's dashboard KPI cards.
const TINT = {
  red: 'bg-red-500/15 text-red-400',
  green: 'bg-emerald-500/15 text-emerald-400',
  purple: 'bg-violet-500/15 text-violet-400',
  orange: 'bg-orange-500/15 text-orange-400',
}

function Tile({
  icon: Icon,
  tint,
  label,
  value,
  testId,
  children,
}: {
  icon: LucideIcon
  tint: keyof typeof TINT
  label: string
  value: string
  testId: string
  children?: React.ReactNode
}) {
  return (
    <div data-testid={testId} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#111113] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs text-muted-fg">{label}</span>
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${TINT[tint]}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <span className="text-3xl font-semibold tabular-nums text-foreground">{value}</span>
      {children}
    </div>
  )
}

interface KpiTilesProps {
  stats: Stats | null
  global: GlobalFigure[]
}

export function KpiTiles({ stats, global }: KpiTilesProps) {
  const pct = (v: number) => `${Math.round(v * 100)}%`
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Measured results of our checker on held-out test messages, not live counters */}
      <Tile icon={ShieldAlert} tint="red" label="Scam messages caught by our model" value={stats ? pct(stats.scam_recall) : '—'} testId="kpi-scam-recall">
        <span className="text-xs text-muted-fg">
          {stats ? `Measured on ${count.format(stats.test_messages)} test messages · trained on ${stats.trained_on}` : 'Results unavailable'}
        </span>
      </Tile>
      <Tile icon={MessageSquareText} tint="green" label="Genuine messages passed" value={stats ? pct(stats.genuine_pass) : '—'} testId="kpi-genuine-pass">
        <span className="text-xs text-muted-fg">
          {stats ? `Measured on ${count.format(stats.genuine_test_messages)} genuine test messages · no message is stored` : 'Results unavailable'}
        </span>
      </Tile>
      {global.map((g, i) => (
        <Tile key={g.label} icon={Globe2} tint={i === 0 ? 'purple' : 'orange'} label={g.label} value={g.unit === 'USD' ? usd.format(g.value) : count.format(g.value)} testId="kpi-global">
          <a href={g.url} target="_blank" rel="noreferrer" className="text-xs text-muted-fg underline decoration-border underline-offset-2 hover:text-primary">
            Source: {g.source} ({g.year})
          </a>
        </Tile>
      ))}
    </div>
  )
}
