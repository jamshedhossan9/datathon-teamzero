import { EXAMPLES } from '@/data/examples'
import { mockScore } from '@/lib/mockScorer'

// The demo scorer is checked against its own fixed texts (the page's examples now use our real checker)
const FIXTURES: Record<string, string> = {
  otp: 'MyBank Alert: Your account has been suspended. Verify your account within 24 hours or it will be closed. Reply with the OTP sent to you or visit bit.ly/mybank-secure',
  parcel: 'Parcel Delivery: Your parcel is on hold due to an unpaid customs fee of $2.99. Pay now at tinyurl.com/parcel-redeliver to avoid return.',
  normal: 'Hey Sarah, are we still on for lunch tomorrow at 12? See you at the usual place. Thanks!',
}
const example = (id: string) => FIXTURES[id]
const slice = (text: string, start: number, end: number) => Array.from(text).slice(start, end).join('')

describe('mockScore', () => {
  it('flags the fake bank OTP example as a scam with an OTP keyword', () => {
    const text = example('otp')
    const r = mockScore(text)
    expect(r.verdict).toBe('scam')
    const otp = r.keywords.find((k) => k.text === 'OTP')
    expect(otp?.direction).toBe('fraud')
    for (const k of r.keywords) expect(slice(text, k.start, k.end)).toBe(k.text)
  })

  it('flags the parcel fee example as a scam', () => {
    expect(mockScore(example('parcel')).verdict).toBe('scam')
  })

  it('treats the normal example as legitimate', () => {
    expect(mockScore(example('normal')).verdict).toBe('legit')
  })

  it('marks every result as mock with 2–4 advice items', () => {
    for (const text of [...Object.values(FIXTURES), ...EXAMPLES.map((e) => e.text)]) {
      const r = mockScore(text)
      expect(r.mock).toBe(true)
      expect(r.advice.length).toBeGreaterThanOrEqual(2)
      expect(r.advice.length).toBeLessThanOrEqual(4)
    }
  })

  it('computes offsets in code points when emoji precede a keyword', () => {
    const text = '🎁 Claim your prize now: bit.ly/x'
    const r = mockScore(text)
    const link = r.keywords.find((k) => k.text === 'bit.ly/x')
    expect(link).toBeDefined()
    expect(slice(text, link!.start, link!.end)).toBe('bit.ly/x')
  })
})
