export type Verdict = 'scam' | 'suspicious' | 'legit'

/** start/end are Unicode code-point offsets into the checked text (end exclusive). */
export interface Keyword {
  text: string
  start: number
  end: number
  direction: 'fraud' | 'legit'
  weight: number
  reason: string
}

/** Who receives the money on a payment link, read from the payment page by the server. */
export interface Payee {
  receiver: string | null
  claimed_sender: string | null
  mismatch: boolean
  status: 'verified' | 'unverified' | 'blocked'
}

export interface CheckResult {
  verdict: Verdict
  scam_probability: number
  keywords: Keyword[]
  explanation: string
  advice: string[]
  latency_ms: number
  model_version: string
  /** short findings from every layer ("Urgency: ...", "It contains a payment link.") */
  reasons?: string[]
  payee?: Payee | null
  /** what the server processed, with personal data masked */
  masked_message?: string
  /** true when produced by the in-browser demo scorer, not the model */
  mock?: boolean
}

export interface Explanation {
  text: string
  /** "granite" = written by IBM Granite on LinuxONE; otherwise a short note */
  source: 'granite' | 'fallback' | 'unavailable'
}

/** Measured results of our model and checker, shown on the dashboard (not live counters). */
export interface Stats {
  scam_recall: number
  genuine_pass: number
  test_messages: number
  genuine_test_messages: number
  trained_on: string
  top_keywords: { text: string; count: number }[]
}

export interface DemoMessage {
  id: number
  sender: string
  message: string
}
