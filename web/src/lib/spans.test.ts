import { buildSpans } from '@/lib/spans'
import type { Keyword } from '@/lib/types'

const kw = (start: number, end: number, text: string, weight = 0.2, direction: Keyword['direction'] = 'fraud'): Keyword => ({
  text,
  start,
  end,
  weight,
  direction,
  reason: 'r',
})

const joined = (spans: { text: string }[]) => spans.map((s) => s.text).join('')

describe('buildSpans', () => {
  it('splits plain text around a keyword', () => {
    const spans = buildSpans('Send OTP now', [kw(5, 8, 'OTP')])
    expect(spans.map((s) => s.text)).toEqual(['Send ', 'OTP', ' now'])
    expect(spans[1].keyword?.text).toBe('OTP')
    expect(spans[0].keyword).toBeUndefined()
  })

  it('uses code-point offsets so emoji do not shift highlights', () => {
    const text = '🎁 Claim your prize: bit.ly/x'
    const spans = buildSpans(text, [kw(20, 28, 'bit.ly/x')])
    const hit = spans.find((s) => s.keyword)
    expect(hit?.text).toBe('bit.ly/x')
    expect(joined(spans)).toBe(text)
  })

  it('lets the higher-weight keyword win on overlap without duplicating text', () => {
    const text = 'abcdefghijklmnop'
    const spans = buildSpans(text, [kw(5, 10, 'fghij', 0.1), kw(8, 14, 'ijklmn', 0.5)])
    expect(joined(spans)).toBe(text)
    expect(spans.find((s) => s.keyword?.weight === 0.5)?.text).toBe('ijklmn')
    expect(spans.find((s) => s.keyword?.weight === 0.1)?.text).toBe('fgh')
  })

  it('drops keywords outside the text instead of throwing', () => {
    const spans = buildSpans('Hello there!', [kw(50, 60, 'x')])
    expect(spans).toEqual([{ text: 'Hello there!' }])
  })

  it('returns the whole text as one span when there are no keywords', () => {
    expect(buildSpans('Hi', [])).toEqual([{ text: 'Hi' }])
  })
})
