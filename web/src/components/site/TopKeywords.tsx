import type { Stats } from '@/lib/types'

interface TopKeywordsProps {
  items: Stats['top_keywords']
}

export function TopKeywords({ items }: TopKeywordsProps) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Top scam words our model learned</h3>
      <p className="mb-4 text-xs text-muted-fg">Word weights learned by the model on IBM LinuxONE (higher = stronger scam signal)</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-fg">Model weights unavailable right now.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((k) => (
            <span
              key={k.text}
              className="inline-flex items-center gap-2 rounded-full border border-scam/25 bg-scam/5 px-3 py-1 text-scam"
              style={{ fontSize: `${0.8 + (k.count / max) * 0.45}rem` }}
            >
              {k.text}
              <span className="font-mono text-xs text-muted-fg">{k.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
