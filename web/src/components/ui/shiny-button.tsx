import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Recreated from the look of @designali-in/shiny-button on 21st.dev: dark navy pill, a rotating
// conic shine with a dot pattern around the border, blue fill on hover. Styles live in index.css.

type Common = { children: ReactNode; className?: string }
type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

export function ShinyButton(props: AsLink | AsButton) {
  const inner = (
    <>
      <span aria-hidden className="shiny-button__fill" />
      <span aria-hidden className="shiny-button__dots" />
      <span aria-hidden className="shiny-button__dots shiny-button__dots--fill" />
      <span className="relative z-10 inline-flex items-center gap-1.5">{props.children}</span>
    </>
  )
  if (props.href !== undefined) {
    const { children: _c, className, ...rest } = props as AsLink
    return (
      <a {...rest} className={cn('shiny-button', className)}>
        {inner}
      </a>
    )
  }
  const { children: _c, className, type = 'button', ...rest } = props as AsButton
  return (
    <button {...rest} type={type} className={cn('shiny-button', className)}>
      {inner}
    </button>
  )
}
