import { render, screen, within } from '@testing-library/react'
import { ResultPanel } from '@/components/site/ResultPanel'
import type { CheckResult } from '@/lib/types'

const base: CheckResult = {
  verdict: 'scam',
  scam_probability: 0.94,
  keywords: [
    { text: 'OTP', start: 10, end: 13, direction: 'fraud', weight: 0.3, reason: 'Asks for a one-time password' },
    { text: 'urgent', start: 0, end: 6, direction: 'fraud', weight: 0.15, reason: 'Creates false urgency' },
  ],
  explanation: 'This message pressures you to share a code.',
  advice: ['Do not reply.', 'Call your bank.', 'Report it.'],
  latency_ms: 38,
  model_version: 'v1',
}
const text = 'urgent: s OTP now'

describe('ResultPanel', () => {
  it.each([
    ['scam', 'Likely scam'],
    ['suspicious', 'Suspicious'],
    ['legit', 'Looks legitimate'],
  ] as const)('labels the %s verdict', (verdict, label) => {
    const { container } = render(<ResultPanel text={text} result={{ ...base, verdict }} />)
    expect(screen.getByRole('heading', { name: label })).toBeInTheDocument()
    expect(container.querySelector('[data-verdict]')).toHaveAttribute('data-verdict', verdict)
  })

  it('does not use the brand font for the verdict heading', () => {
    render(<ResultPanel text={text} result={base} />)
    expect(screen.getByRole('heading', { name: 'Likely scam' })).not.toHaveClass('font-display')
  })

  it('shows the scam probability as a rounded percentage', () => {
    render(<ResultPanel text={text} result={base} />)
    expect(screen.getByTestId('scam-gauge')).toHaveTextContent('94')
  })

  it('shows the explanation, every advice item and the LinuxONE latency', () => {
    render(<ResultPanel text={text} result={base} />)
    expect(screen.getByText(base.explanation)).toBeInTheDocument()
    const list = screen.getByRole('list', { name: /what to do/i })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText(/on IBM LinuxONE/)).toBeInTheDocument()
    expect(screen.getByTestId('latency')).toHaveTextContent('38')
  })

  it('shows a Demo mode badge only for mock results', () => {
    const { rerender } = render(<ResultPanel text={text} result={base} />)
    expect(screen.queryByText('Demo mode')).toBeNull()
    rerender(<ResultPanel text={text} result={{ ...base, mock: true }} />)
    expect(screen.getByText('Demo mode')).toBeInTheDocument()
  })

  it('keeps long keyword chips inside the card', () => {
    const long = 'bit.ly/' + 'a'.repeat(200)
    render(<ResultPanel text={long} result={{ ...base, keywords: [{ text: long, start: 0, end: long.length, direction: 'fraud', weight: 0.3, reason: 'r' }] }} />)
    const chip = screen.getByTestId('keyword-chip')
    expect(chip).toHaveClass('max-w-full')
    expect(chip.querySelector('.truncate')).not.toBeNull()
  })

  it('never claims LinuxONE for a mock result', () => {
    render(<ResultPanel text={text} result={{ ...base, mock: true }} />)
    expect(screen.queryByText(/on IBM LinuxONE/)).toBeNull()
    expect(screen.getByText(/demo rules in your browser/)).toBeInTheDocument()
  })

  it('lists keyword chips by weight, or says none were flagged', () => {
    const { rerender } = render(<ResultPanel text={text} result={base} />)
    const chips = screen.getAllByTestId('keyword-chip').map((c) => c.textContent)
    expect(chips[0]).toContain('OTP')
    expect(chips[1]).toContain('urgent')
    rerender(<ResultPanel text={text} result={{ ...base, keywords: [] }} />)
    expect(screen.getByText('No specific keywords flagged')).toBeInTheDocument()
  })

  it('shows who gets the money, and warns when it does not match the claimed sender', () => {
    const payee = { receiver: 'Ahmad Enterprise', claimed_sender: 'Syarikat Elektrik Contoh', mismatch: true, status: 'verified' as const }
    render(<ResultPanel text={text} result={{ ...base, verdict: 'suspicious', payee }} explain={false} />)
    const banner = screen.getByTestId('payee')
    expect(banner).toHaveTextContent('Payment goes to: Ahmad Enterprise')
    expect(banner).toHaveTextContent('claims to be from Syarikat Elektrik Contoh')
  })

  it('shows the AI explanation box for real results only, never for demo results', () => {
    const { rerender } = render(<ResultPanel text={text} result={base} />)
    expect(screen.getByTestId('granite-box')).toBeInTheDocument()
    rerender(<ResultPanel text={text} result={{ ...base, mock: true }} />)
    expect(screen.queryByTestId('granite-box')).toBeNull()
  })
})
