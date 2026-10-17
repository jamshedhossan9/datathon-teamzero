import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FloatingBackground } from '@/components/site/FloatingBackground'
import { Footer } from '@/components/site/Footer'
import { Hero } from '@/components/site/Hero'
import { Nav } from '@/components/site/Nav'
import { RevealIntro } from '@/components/site/RevealIntro'
import KineticGrid from '@/components/ui/kinetic-grid'
import { APP_NAME, HEADLINE, SUBLINE } from '@/lib/constants'

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => mockReducedMotion(false))

describe('Nav', () => {
  it('shows the app name and section links, without sign-in buttons', () => {
    render(<Nav />)
    expect(screen.getAllByText(APP_NAME).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Check' })[0]).toHaveAttribute('href', '/#check')
    expect(screen.getAllByRole('link', { name: 'Dashboard' })[0]).toHaveAttribute('href', '#dashboard')
    expect(screen.getAllByRole('link', { name: 'Inbox demo' })[0]).toHaveAttribute('href', '/inbox')
    expect(screen.queryByText(/sign in/i)).toBeNull()
    expect(screen.queryByText(/sign up/i)).toBeNull()
  })

  it('toggles the mobile menu', async () => {
    render(<Nav />)
    const toggle = screen.getByRole('button', { name: 'Toggle menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('FloatingBackground', () => {
  it('is decorative, non-interactive, with no fixed IBM Z watermark text', () => {
    const { container } = render(<FloatingBackground />)
    const root = container.firstElementChild!
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root).toHaveClass('pointer-events-none')
    expect(root.textContent).not.toContain('IBM Z')
  })
})

describe('KineticGrid', () => {
  it('renders a decorative canvas behind its children', () => {
    render(
      <KineticGrid globalColor="monochrome">
        <p>content</p>
      </KineticGrid>,
    )
    expect(screen.getByText('content')).toBeInTheDocument()
    const canvas = document.querySelector('canvas')!
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(canvas).toHaveClass('pointer-events-none')
  })
})

describe('Hero', () => {
  it('uses the product name as the title, the team line as subheading and a smaller IBM Z line', () => {
    render(
      <Hero play>
        <div />
      </Hero>,
    )
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(APP_NAME)
    expect(h1).toHaveClass('font-display')
    const sub = screen.getByText(HEADLINE)
    expect(sub).not.toHaveClass('font-display')
    expect(screen.getByText(SUBLINE)).toHaveClass('text-sm')
  })

  it('shows the competition name as a small title and the landscape link as its own button', () => {
    render(
      <Hero play>
        <div />
      </Hero>,
    )
    const eyebrow = screen.getByText('IBM Z Datathon 2026')
    expect(eyebrow.closest('a, button')).toBeNull()
    const cta = screen.getByRole('link', { name: /see the scam landscape/i })
    expect(cta).toHaveAttribute('href', '#dashboard')
    expect(cta.parentElement).not.toContainElement(eyebrow)
  })
})

describe('brand font', () => {
  it('is used only for the product name', () => {
    const { container } = render(
      <>
        <Nav />
        <Hero play>
          <div />
        </Hero>
      </>,
    )
    for (const el of container.querySelectorAll('.font-display')) expect(el.textContent).toBe(APP_NAME)
  })
})

describe('RevealIntro', () => {
  it('finishes immediately when the user prefers reduced motion', () => {
    mockReducedMotion(true)
    const onDone = vi.fn()
    render(<RevealIntro onDone={onDone} />)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})

describe('Footer', () => {
  it('credits the team and links the repo', () => {
    render(<Footer repoUrl="https://github.com/example/repo" />)
    expect(screen.getByText(/Team Zero/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute('href', 'https://github.com/example/repo')
  })
})
