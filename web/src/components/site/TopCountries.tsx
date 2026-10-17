import type { CountryFigure } from '@/lib/worldData'

interface TopCountriesProps {
  countries: CountryFigure[]
  limit: number
}

export function TopCountries({ countries, limit }: TopCountriesProps) {
  const rows = [...countries].sort((a, b) => b.value - a.value).slice(0, limit)
  const max = rows[0]?.value ?? 1
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Hardest-hit countries</h3>
      <p className="mb-4 text-xs text-muted-fg">{rows[0]?.metric}</p>
      <ol className="space-y-3">
        {rows.map((c, i) => (
          <li key={c.iso3} data-testid="country-row" className="text-sm">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-foreground">
                <span className="mr-2 font-mono text-xs text-muted-fg">{String(i + 1).padStart(2, '0')}</span>
                {c.country}
              </span>
              <span className="font-mono text-foreground">{c.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-highlight to-primary" style={{ width: `${(c.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
