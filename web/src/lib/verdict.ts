import type { Verdict } from '@/lib/types'

export function verdictFor(p: number): Verdict {
  if (p >= 0.7) return 'scam'
  if (p >= 0.4) return 'suspicious'
  return 'legit'
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  scam: 'Likely scam',
  suspicious: 'Suspicious',
  legit: 'Looks legitimate',
}
