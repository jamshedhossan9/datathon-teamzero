import { render, screen } from '@testing-library/react'
import { ShinyButton } from '@/components/ui/shiny-button'

describe('ShinyButton', () => {
  it('renders a link when given an href, with the shiny style', () => {
    render(<ShinyButton href="#dashboard">Go</ShinyButton>)
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).toHaveAttribute('href', '#dashboard')
    expect(link).toHaveClass('shiny-button')
  })

  it('has separate fade-in layers for the hover fill and dots', () => {
    const { container } = render(<ShinyButton href="#x">Go</ShinyButton>)
    expect(container.querySelector('.shiny-button__fill')).toHaveAttribute('aria-hidden')
    expect(container.querySelector('.shiny-button__dots--fill')).toHaveAttribute('aria-hidden')
  })

  it('renders a button otherwise', () => {
    render(<ShinyButton>Click</ShinyButton>)
    expect(screen.getByRole('button', { name: 'Click' })).toHaveClass('shiny-button')
  })
})
