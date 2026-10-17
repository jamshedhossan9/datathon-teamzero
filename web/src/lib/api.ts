import { API_TIMEOUT_MS, EXPLAIN_TIMEOUT_MS } from '@/lib/constants'
import { mockScore } from '@/lib/mockScorer'
import type { CheckResult, DemoMessage, Explanation, Payee, Stats } from '@/lib/types'

type ApiMode = 'mock' | 'api'

let mode: ApiMode = (import.meta.env.VITE_API_MODE as ApiMode | undefined) ?? (import.meta.env.PROD ? 'api' : 'mock')

/** Override the mode (tests, or a future toggle). */
export function setApiMode(next: ApiMode) {
  mode = next
}

async function request<T>(url: string, init: RequestInit, signal?: AbortSignal, timeoutMs = API_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (err) {
    if (timedOut) throw new Error('timeout')
    throw err
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

const VERDICTS = new Set(['scam', 'suspicious', 'legit'])

/** Guard the UI against a malformed response: fill optional lists, reject anything unrenderable. */
function parseCheckResult(data: unknown): CheckResult {
  const d = (data ?? {}) as Partial<CheckResult>
  if (!VERDICTS.has(d.verdict as string)) throw new Error('bad response: verdict')
  if (typeof d.scam_probability !== 'number' || !Number.isFinite(d.scam_probability)) throw new Error('bad response: scam_probability')
  return {
    verdict: d.verdict!,
    scam_probability: d.scam_probability,
    keywords: Array.isArray(d.keywords) ? d.keywords : [],
    explanation: typeof d.explanation === 'string' ? d.explanation : '',
    advice: Array.isArray(d.advice) ? d.advice : [],
    latency_ms: typeof d.latency_ms === 'number' ? d.latency_ms : 0,
    model_version: typeof d.model_version === 'string' ? d.model_version : 'unknown',
    reasons: Array.isArray(d.reasons) ? d.reasons : [],
    payee: d.payee && typeof d.payee === 'object' ? (d.payee as Payee) : null,
    masked_message: typeof d.masked_message === 'string' ? d.masked_message : undefined,
  }
}

export async function checkMessage(text: string, signal?: AbortSignal): Promise<CheckResult> {
  if (mode === 'mock') {
    const started = performance.now()
    const result = mockScore(text)
    return { ...result, latency_ms: Math.max(1, Math.round(performance.now() - started)) }
  }
  const data = await request<unknown>(
    '/api/check',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) },
    signal,
  )
  return parseCheckResult(data)
}

export async function getStats(signal?: AbortSignal): Promise<Stats> {
  // No model is running in mock mode, so there is no live count to show.
  if (mode === 'mock') throw new Error('stats unavailable in demo mode')
  return request<Stats>('/api/stats', { method: 'GET' }, signal)
}

/** IBM Granite's plain-language explanation, asked for after the result is shown. */
export async function explainMessage(text: string, signal?: AbortSignal): Promise<Explanation> {
  if (mode === 'mock') return { text: 'The AI explanation is not available in demo mode.', source: 'unavailable' }
  return request<Explanation>(
    '/api/explain',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) },
    signal,
    EXPLAIN_TIMEOUT_MS,
  )
}

/** The made-up messages for the live inbox demo. */
export async function getDemoMessages(signal?: AbortSignal): Promise<DemoMessage[]> {
  return request<DemoMessage[]>('/demo-messages', { method: 'GET' }, signal)
}
