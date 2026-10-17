import { motion } from 'motion/react'
import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import world from 'world-atlas/countries-110m.json'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import type { CountryFigure } from '@/lib/worldData'

// world-atlas uses ISO 3166-1 numeric ids; markers sit on approximate country centres.
const ISO: Record<string, { numeric: string; coords: [number, number] }> = {
  PAK: { numeric: '586', coords: [69.3, 30.4] },
  KEN: { numeric: '404', coords: [37.9, 0.2] },
  ZAF: { numeric: '710', coords: [24.7, -29.0] },
  THA: { numeric: '764', coords: [101.0, 15.1] },
  MYS: { numeric: '458', coords: [102.0, 4.2] },
  TWN: { numeric: '158', coords: [121.0, 23.7] },
  JPN: { numeric: '392', coords: [138.3, 36.2] },
}

const EMPTY = '#1f2937'

interface WorldFraudMapProps {
  countries: CountryFigure[]
}

export function WorldFraudMap({ countries }: WorldFraudMapProps) {
  const reduce = usePrefersReducedMotion()
  const [hover, setHover] = useState<CountryFigure | null>(null)
  const byNumeric = new Map(countries.filter((c) => ISO[c.iso3]).map((c) => [ISO[c.iso3].numeric, c]))
  const max = Math.max(...countries.map((c) => c.value))
  const top = [...countries].sort((a, b) => b.value - a.value).slice(0, 10)
  const shade = (v: number) => `color-mix(in oklab, var(--primary) ${Math.round(25 + (v / max) * 75)}%, ${EMPTY})`

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-border bg-surface p-2">
      <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 165 }} width={800} height={400} className="h-auto w-full" role="img" aria-label="World map of scam losses as a share of GDP">
        <Geographies geography={world as never}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fig = byNumeric.get(String(geo.id))
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  tabIndex={fig ? 0 : -1}
                  aria-label={fig ? `${fig.country}: ${fig.value}% of GDP` : undefined}
                  onMouseEnter={() => fig && setHover(fig)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => fig && setHover(fig)}
                  onBlur={() => setHover(null)}
                  fill={fig ? shade(fig.value) : EMPTY}
                  stroke="#000000"
                  strokeWidth={0.5}
                  className={fig ? 'cursor-pointer outline-none transition-[fill] duration-200 hover:fill-primary focus-visible:fill-primary' : 'outline-none'}
                />
              )
            })
          }
        </Geographies>
        {top.map((c, i) =>
          ISO[c.iso3] ? (
            <Marker key={c.iso3} coordinates={ISO[c.iso3].coords}>
              {!reduce && (
                <motion.circle
                  r={4 + Math.sqrt(c.value) * 3}
                  fill="var(--highlight)"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  initial={{ opacity: 0.5, scale: 0.6 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
                />
              )}
              <circle r={2.5 + Math.sqrt(c.value) * 1.5} fill="var(--highlight)" stroke="#000000" strokeWidth={1} />
            </Marker>
          ) : null,
        )}
      </ComposableMap>

      <div aria-live="polite" className="pointer-events-none absolute left-4 top-4 min-h-12">
        {hover && (
          <div className="rounded-lg border border-border bg-foreground px-3 py-2 text-xs text-background shadow-lg">
            <div className="font-semibold">{hover.country}</div>
            <div className="font-mono">
              {hover.value}% of GDP lost to scams · {hover.year}
            </div>
            <div className="opacity-70">{hover.source}</div>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-4 flex items-center gap-2 text-[11px] text-muted-fg">
        <span>Lower</span>
        <span className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(to right, ${EMPTY}, var(--primary))` }} />
        <span>Higher</span>
      </div>
    </div>
  )
}
