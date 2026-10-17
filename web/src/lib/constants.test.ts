import { API_TIMEOUT_MS, APP_NAME, HEADLINE, MAX_CHARS, SUBLINE } from '@/lib/constants'

describe('site constants', () => {
  it('uses the agreed copy and limits', () => {
    expect(HEADLINE).toBe('Developed by Team Zero – University of Cyberjaya')
    expect(SUBLINE).toBe('Powered by IBM Z')
    expect(APP_NAME).toBe('ZeroScam')
    expect(MAX_CHARS).toBe(2000)
    expect(API_TIMEOUT_MS).toBe(15000)
  })
})
