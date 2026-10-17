import { FolderGit2 } from 'lucide-react'

interface FooterProps {
  repoUrl: string
}

export function Footer({ repoUrl }: FooterProps) {
  return (
    <footer className="border-t border-border bg-surface/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-fg md:flex-row">
        <p>Team Zero · University of Cyberjaya · Powered by IBM Z / LinuxONE</p>
        <div className="flex items-center gap-5">
          <span className="font-mono text-xs">No messages are stored</span>
          <a href={repoUrl} className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary" target="_blank" rel="noreferrer">
            <FolderGit2 className="size-4" /> GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
