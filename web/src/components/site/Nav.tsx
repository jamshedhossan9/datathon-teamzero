import { Menu, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { APP_NAME } from '@/lib/constants'

// Check and Inbox demo are separate pages; the dashboard is on both pages, so its link only scrolls
const LINKS = [
  { href: '/#check', label: 'Check' },
  { href: '#dashboard', label: 'Dashboard' },
  { href: '/inbox', label: 'Inbox demo' },
]

// Structure from the 21st.dev SaaS template nav, restyled; sign-in buttons removed (no accounts).
export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/#top" className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="size-6 text-primary" strokeWidth={2} />
          <span className="font-display text-xl">{APP_NAME}</span>
        </a>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-fg transition-colors duration-200 hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>

        <span className="hidden rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-muted-fg md:inline">
          on IBM LinuxONE
        </span>

        <button
          type="button"
          className="rounded-md p-1 text-foreground md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border/70 bg-background/95 px-6 py-4 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-2">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="py-2 text-sm font-medium text-muted-fg hover:text-foreground" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
