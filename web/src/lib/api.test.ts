import { checkMessage, getStats, setApiMode } from '@/lib/api'
import { API_TIMEOUT_MS } from '@/lib/constants'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('checkMessage', () => {
  it('does not call the network in mock mode', async () => {
    setApiMode('mock')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const r = await checkMessage('Your OTP is needed to verify your account')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(r.mock).toBe(true)
  })

  it('POSTs the text as JSON to /api/check in api mode', async () => {
    setApiMode('api')
    const body = { verdict: 'legit', scam_probability: 0.1, keywords: [], explanation: 'x', advice: ['a', 'b'], latency_ms: 12, model_version: 'v1' }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))
    const r = await checkMessage('hello there')
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/check')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ text: 'hello there' })
    expect(r.latency_ms).toBe(12)
  })

  it('rejects with "timeout" when the API does not answer in time', async () => {
    setApiMode('api')
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    )
    const p = checkMessage('hello')
    const assertion = expect(p).rejects.toThrow('timeout')
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS + 1)
    await assertion
  })
})

describe('checkMessage response validation', () => {
  const ok = (body: unknown) => vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

  it('defaults missing keywords and advice to empty lists', async () => {
    setApiMode('api')
    ok({ verdict: 'scam', scam_probability: 0.9, explanation: 'x', latency_ms: 5, model_version: 'v1' })
    const r = await checkMessage('hello')
    expect(r.keywords).toEqual([])
    expect(r.advice).toEqual([])
  })

  it('rejects an unknown verdict so the UI shows its error state', async () => {
    setApiMode('api')
    ok({ verdict: 'fraud', scam_probability: 0.9, keywords: [], explanation: 'x', advice: [], latency_ms: 5, model_version: 'v1' })
    await expect(checkMessage('hello')).rejects.toThrow()
  })

  it('rejects a non-numeric probability', async () => {
    setApiMode('api')
    ok({ verdict: 'scam', scam_probability: 'high', keywords: [], explanation: 'x', advice: [], latency_ms: 5, model_version: 'v1' })
    await expect(checkMessage('hello')).rejects.toThrow()
  })
})

describe('getStats', () => {
  it('rejects in mock mode so no fake live counter is shown', async () => {
    setApiMode('mock')
    await expect(getStats()).rejects.toThrow()
  })

  it('rejects on a non-2xx response', async () => {
    setApiMode('api')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }))
    await expect(getStats()).rejects.toThrow()
  })
})
