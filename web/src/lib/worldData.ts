import raw from '@/data/world-fraud.json'

export interface CountryFigure {
  iso3: string
  country: string
  value: number
  metric: string
  year: number
  source: string
  url: string
}

export interface GlobalFigure {
  label: string
  value: number
  unit: string
  year: number
  source: string
  url: string
}

export interface WorldData {
  countries: CountryFigure[]
  global: GlobalFigure[]
}

function cited(entry: Record<string, unknown>, where: string) {
  if (typeof entry.source !== 'string' || !entry.source.trim()) throw new Error(`${where}: missing source`)
  if (typeof entry.url !== 'string' || !entry.url.startsWith('https://')) throw new Error(`${where}: missing https url`)
  if (typeof entry.value !== 'number' || !Number.isFinite(entry.value) || entry.value <= 0) throw new Error(`${where}: bad value`)
}

/** Throws if any figure lacks a citation — uncited numbers must never reach the page. */
export function validateWorldData(data: unknown): WorldData {
  const d = data as { countries?: Record<string, unknown>[]; global?: Record<string, unknown>[] }
  if (!Array.isArray(d.countries) || !Array.isArray(d.global)) throw new Error('world data: bad shape')
  d.countries.forEach((c, i) => {
    cited(c, `countries[${i}]`)
    if (typeof c.iso3 !== 'string' || !/^[A-Z]{3}$/.test(c.iso3)) throw new Error(`countries[${i}]: bad iso3`)
  })
  d.global.forEach((g, i) => cited(g, `global[${i}]`))
  return d as unknown as WorldData
}

export function loadWorldData(): WorldData {
  return validateWorldData(raw)
}
