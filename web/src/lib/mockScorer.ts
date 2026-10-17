import type { CheckResult, Keyword } from '@/lib/types'
import { verdictFor } from '@/lib/verdict'

interface Rule {
  pattern: RegExp
  direction: Keyword['direction']
  weight: number
  reason: string
}

// Demo-only heuristics so the page works before the LinuxONE model is reachable.
const RULES: Rule[] = [
  { pattern: /\bOTP\b/gi, direction: 'fraud', weight: 0.3, reason: 'Asks for a one-time password — banks never ask for this' },
  { pattern: /\b(?:PIN|password|bank details)\b/gi, direction: 'fraud', weight: 0.3, reason: 'Asks for secret banking details' },
  { pattern: /\bverify your account\b/gi, direction: 'fraud', weight: 0.2, reason: 'Pressure to "verify" your account' },
  { pattern: /\b(?:within 24 hours|immediately|urgent|act now)\b/gi, direction: 'fraud', weight: 0.15, reason: 'Creates false urgency' },
  { pattern: /\b(?:suspended|blocked|closed)\b/gi, direction: 'fraud', weight: 0.15, reason: 'Threatens your account' },
  { pattern: /\b(?:bit\.ly|tinyurl\.com|cutt\.ly|t\.co)\/\S+/gi, direction: 'fraud', weight: 0.25, reason: 'Shortened link hides the real website' },
  { pattern: /\b(?:unpaid|customs fee|delivery fee|redelivery fee)\b/gi, direction: 'fraud', weight: 0.25, reason: 'Asks you to pay an unexpected fee' },
  { pattern: /\bpay now\b/gi, direction: 'fraud', weight: 0.2, reason: 'Pushes an immediate payment' },
  { pattern: /\b(?:claim your prize|you(?:'ve| have) won|congratulations)\b/gi, direction: 'fraud', weight: 0.3, reason: 'Prize you never entered for' },
  { pattern: /\bsee you\b/gi, direction: 'legit', weight: 0.15, reason: 'Personal, conversational tone' },
  { pattern: /\b(?:lunch|dinner|tomorrow)\b/gi, direction: 'legit', weight: 0.1, reason: 'Everyday plans, no request for money or data' },
  { pattern: /\bthanks\b/gi, direction: 'legit', weight: 0.05, reason: 'Friendly sign-off' },
]

const codePoints = (s: string) => Array.from(s).length

const ADVICE: Record<CheckResult['verdict'], string[]> = {
  scam: [
    'Do not click any links or reply to the message.',
    'Never share OTPs, PINs or passwords — call your bank on the number printed on your card.',
    'Report it: ScamShield / 1799 (Singapore) or NSRC 997 (Malaysia).',
  ],
  suspicious: [
    'Do not click links until you have checked with the sender through an official channel.',
    'Never share OTPs, PINs or passwords.',
  ],
  legit: [
    'This looks normal, but stay careful with unexpected links or payment requests.',
    'If the sender later asks for money or codes, check again.',
  ],
}

const EXPLANATION: Record<CheckResult['verdict'], string> = {
  scam: 'This message uses common scam tactics: it creates urgency and asks for codes, payments or a click on a disguised link.',
  suspicious: 'Some parts of this message match scam patterns. It may be genuine, but verify it before acting.',
  legit: 'No common scam signals were found. The message reads like everyday conversation.',
}

export function mockScore(text: string): CheckResult {
  const keywords: Keyword[] = []
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.pattern)) {
      const start = codePoints(text.slice(0, m.index))
      keywords.push({ text: m[0], start, end: start + codePoints(m[0]), direction: rule.direction, weight: rule.weight, reason: rule.reason })
    }
  }
  const score = keywords.reduce((p, k) => p + (k.direction === 'fraud' ? k.weight : -k.weight), 0.1)
  const p = Math.min(0.98, Math.max(0.02, score))
  const verdict = verdictFor(p)
  return {
    verdict,
    scam_probability: Math.round(p * 100) / 100,
    keywords: keywords.sort((a, b) => b.weight - a.weight),
    explanation: EXPLANATION[verdict],
    advice: ADVICE[verdict],
    latency_ms: 0,
    model_version: 'demo-rules',
    mock: true,
  }
}
