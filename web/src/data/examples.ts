// Made-up demo messages: no real organisation, person or account.
// The bill points to our own made-up payment page, served by the same server (step 405).
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:38889'

export const EXAMPLES = [
  {
    id: 'normal',
    label: 'Normal message',
    text: "Hi mum, I'll be home by 7. Can you keep some rice for me?",
  },
  {
    id: 'scam-ms',
    label: 'Scam (Malay)',
    text: 'Pegawai bank di sini. Akaun anda akan disekat. Sila kongsi kod pengesahan yang dihantar ke telefon anda segera.',
  },
  {
    id: 'bill',
    label: 'Bill with a swapped payee',
    text: `Syarikat Elektrik Contoh: Your electricity bill for September is RM84.20. Pay here: ${origin}/pay/mismatch`,
  },
] as const satisfies readonly { id: string; label: string; text: string }[]
