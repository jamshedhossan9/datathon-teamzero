import type { Keyword } from '@/lib/types'

export type Span = { text: string; keyword?: Keyword }

/**
 * Split text into plain and keyword spans. Offsets are code points; on overlap
 * the higher-weight keyword keeps the contested characters.
 */
export function buildSpans(text: string, keywords: Keyword[]): Span[] {
  const chars = Array.from(text)
  const owner: (Keyword | undefined)[] = new Array(chars.length)
  const ranked = [...keywords].sort((a, b) => b.weight - a.weight)
  for (const k of ranked) {
    if (k.start < 0 || k.end > chars.length || k.start >= k.end) continue
    for (let i = k.start; i < k.end; i++) owner[i] ??= k
  }

  const spans: Span[] = []
  for (let i = 0; i < chars.length; i++) {
    const last = spans[spans.length - 1]
    if (last && last.keyword === owner[i]) last.text += chars[i]
    else spans.push(owner[i] ? { text: chars[i], keyword: owner[i] } : { text: chars[i] })
  }
  return spans
}
