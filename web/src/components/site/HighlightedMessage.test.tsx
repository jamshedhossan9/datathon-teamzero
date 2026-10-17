import { render, screen } from '@testing-library/react'
import { HighlightedMessage } from '@/components/site/HighlightedMessage'
import type { Keyword } from '@/lib/types'

const keywords: Keyword[] = [
  { text: 'OTP', start: 5, end: 8, direction: 'fraud', weight: 0.3, reason: 'Asks for a one-time password' },
  { text: 'Thanks', start: 13, end: 19, direction: 'legit', weight: 0.05, reason: 'Friendly sign-off' },
]

describe('HighlightedMessage', () => {
  it('marks fraud and legit keywords with their direction and reason', () => {
    render(<HighlightedMessage text="Send OTP now Thanks" keywords={keywords} />)
    const otp = screen.getByText('OTP').closest('[data-direction]')!
    expect(otp).toHaveAttribute('data-direction', 'fraud')
    expect(otp.getAttribute('aria-label')).toContain('Asks for a one-time password')
    const thanks = screen.getByText('Thanks').closest('[data-direction]')!
    expect(thanks).toHaveAttribute('data-direction', 'legit')
  })

  it('wraps long unbroken strings instead of overflowing', () => {
    const { container } = render(<HighlightedMessage text={'x'.repeat(300)} keywords={[]} />)
    expect(container.firstElementChild).toHaveClass('[overflow-wrap:anywhere]')
  })
})
