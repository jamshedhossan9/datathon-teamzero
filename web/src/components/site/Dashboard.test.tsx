import { render, screen, waitFor, within } from '@testing-library/react'
import { Dashboard } from '@/components/site/Dashboard'
import { TopCountries } from '@/components/site/TopCountries'
import { setApiMode } from '@/lib/api'
import type { CountryFigure } from '@/lib/worldData'
import { loadWorldData } from '@/lib/worldData'

// The SVG map is exercised visually in the browser; jsdom has no layout for it.
vi.mock('@/components/site/WorldFraudMap', () => ({ WorldFraudMap: () => <div data-testid="world-map" /> }))

let fetchSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => setApiMode('api'))
afterEach(() => vi.restoreAllMocks())

function statsOk() {
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
    async () =>
      new Response(JSON.stringify({ scam_recall: 0.916, genuine_pass: 0.934, test_messages: 1035, genuine_test_messages: 904, trained_on: 'IBM LinuxONE', top_keywords: [{ text: 'claim', count: 4.3 }] }), {
        status: 200,
      }),
  )
}

// Stats endpoint down: render, then wait until the failed request has been handled.
async function renderWithStatsDown() {
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('down', { status: 503 }))
  render(<Dashboard />)
  await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
  await new Promise((r) => setTimeout(r, 0))
}

describe('Dashboard', () => {
  it('shows the measured results and the model\'s top scam words from the API', async () => {
    statsOk()
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByTestId('kpi-scam-recall')).toHaveTextContent('92%'))
    expect(screen.getByTestId('kpi-scam-recall')).toHaveTextContent('1,035 test messages')
    expect(screen.getByTestId('kpi-genuine-pass')).toHaveTextContent('93%')
    expect(screen.getByText('claim')).toBeInTheDocument()
  })

  it('shows dashes for live tiles when stats fail, and still renders the rest', async () => {
    await renderWithStatsDown()
    expect(screen.getByTestId('kpi-scam-recall')).toHaveTextContent('—')
    expect(screen.getByTestId('kpi-genuine-pass')).toHaveTextContent('—')
    expect(screen.getByTestId('world-map')).toBeInTheDocument()
    expect(screen.getAllByTestId('kpi-global')).toHaveLength(2)
  })

  it('does not use the brand font for its heading', async () => {
    await renderWithStatsDown()
    expect(screen.getByRole('heading', { name: 'The scam landscape' })).not.toHaveClass('font-display')
  })

  it('footnotes global tiles with their source links', async () => {
    await renderWithStatsDown()
    const [first] = screen.getAllByTestId('kpi-global')
    expect(within(first).getByRole('link')).toHaveAttribute('href', loadWorldData().global[0].url)
  })

  it('lists each unique source once in the source line', async () => {
    await renderWithStatsDown()
    const line = screen.getByTestId('source-line')
    const all = [...loadWorldData().countries, ...loadWorldData().global].map((e) => e.source)
    expect(within(line).getAllByRole('link')).toHaveLength(new Set(all).size)
  })
})

describe('TopCountries', () => {
  it('shows at most the limit, sorted by value descending', () => {
    const countries: CountryFigure[] = Array.from({ length: 12 }, (_, i) => ({
      iso3: `C${String.fromCharCode(65 + i)}X`,
      country: `Country ${i}`,
      value: i + 1,
      metric: 'm',
      year: 2024,
      source: 's',
      url: 'https://x',
    }))
    render(<TopCountries countries={countries} limit={10} />)
    const rows = screen.getAllByTestId('country-row')
    expect(rows).toHaveLength(10)
    expect(rows[0]).toHaveTextContent('Country 11')
    expect(rows[9]).toHaveTextContent('Country 2')
  })
})
