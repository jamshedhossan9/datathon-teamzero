import { verdictFor } from '@/lib/verdict'

describe('verdictFor', () => {
  it('maps probability to verdict at the agreed thresholds', () => {
    expect(verdictFor(0.7)).toBe('scam')
    expect(verdictFor(0.69)).toBe('suspicious')
    expect(verdictFor(0.4)).toBe('suspicious')
    expect(verdictFor(0.39)).toBe('legit')
  })
})
