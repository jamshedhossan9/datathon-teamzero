import { useCallback, useState } from 'react'
import { Checker } from '@/components/site/Checker'
import { Dashboard } from '@/components/site/Dashboard'
import { FloatingBackground } from '@/components/site/FloatingBackground'
import { Footer } from '@/components/site/Footer'
import { Hero } from '@/components/site/Hero'
import { Inbox } from '@/components/site/Inbox'
import { Nav } from '@/components/site/Nav'
import { RevealIntro } from '@/components/site/RevealIntro'
import KineticGrid from '@/components/ui/kinetic-grid'
import { REPO_URL } from '@/lib/constants'

// The grid background's wrapper uses overflow:hidden, which silently disables position:sticky inside it;
// overflow-x:clip still stops sideways scrolling but keeps sticky working (the inbox phone)
const PAGE_WRAPPER = 'text-foreground overflow-visible overflow-x-clip'

// Two pages served by the same Flask app: the checker one-pager at "/" and the live inbox demo at "/inbox".
const isInboxPage = () => typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/inbox'

export default function App() {
  const [revealed, setRevealed] = useState(false)
  const onRevealDone = useCallback(() => setRevealed(true), [])

  if (isInboxPage()) {
    return (
      <KineticGrid globalColor="monochrome" className={PAGE_WRAPPER}>
        <FloatingBackground />
        <Nav />
        <main>
          <Inbox />
          <Dashboard />
        </main>
        <Footer repoUrl={REPO_URL} />
      </KineticGrid>
    )
  }

  return (
    <KineticGrid globalColor="monochrome" className={PAGE_WRAPPER}>
      {!revealed && <RevealIntro onDone={onRevealDone} />}
      <FloatingBackground />
      <Nav />
      <main>
        <Hero play={revealed}>
          <Checker />
        </Hero>
        <Dashboard />
      </main>
      <Footer repoUrl={REPO_URL} />
    </KineticGrid>
  )
}
