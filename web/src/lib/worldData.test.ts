import raw from '@/data/world-fraud.json'
import { loadWorldData, validateWorldData } from '@/lib/worldData'

describe('world fraud data', () => {
  const { countries, global } = loadWorldData()

  it('cites a source for every country figure', () => {
    expect(countries.length).toBeGreaterThan(0)
    for (const c of countries) {
      expect(c.source.trim()).not.toBe('')
      expect(c.url.startsWith('https://')).toBe(true)
      expect(c.iso3).toMatch(/^[A-Z]{3}$/)
      expect(Number.isFinite(c.value) && c.value > 0).toBe(true)
      expect(c.year).toBeGreaterThanOrEqual(2020)
      expect(c.year).toBeLessThanOrEqual(2026)
    }
  })

  it('uses one metric for every country', () => {
    expect(new Set(countries.map((c) => c.metric)).size).toBe(1)
  })

  it('has exactly two cited global figures', () => {
    expect(global).toHaveLength(2)
    for (const g of global) expect(g.url.startsWith('https://')).toBe(true)
  })

  it('rejects an entry without a url', () => {
    const broken = structuredClone(raw) as { countries: Record<string, unknown>[] }
    delete broken.countries[0].url
    expect(() => validateWorldData(broken)).toThrow()
  })
})
