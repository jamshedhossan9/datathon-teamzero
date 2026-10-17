import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checker } from '@/components/site/Checker'
import { EXAMPLES } from '@/data/examples'
import { checkMessage } from '@/lib/api'
import type { CheckResult } from '@/lib/types'

vi.mock('@/lib/api', () => ({
  checkMessage: vi.fn(),
  getStats: vi.fn(),
  explainMessage: vi.fn(async () => ({ text: 'Granite says hi', source: 'granite' })),
}))
const mockedCheck = vi.mocked(checkMessage)

const result = (verdict: CheckResult['verdict'], explanation = 'because'): CheckResult => ({
  verdict,
  scam_probability: verdict === 'scam' ? 0.9 : 0.1,
  keywords: [],
  explanation,
  advice: ['a', 'b'],
  latency_ms: 20,
  model_version: 'v1',
})

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const textarea = () => screen.getByRole('textbox', { name: /message to check/i })
const button = () => screen.getByRole('button', { name: /check message/i })

beforeEach(() => mockedCheck.mockReset())

describe('Checker', () => {
  it('disables the button for empty or whitespace-only input', async () => {
    render(<Checker />)
    expect(button()).toBeDisabled()
    await userEvent.type(textarea(), '   ')
    fireEvent.change(textarea(), { target: { value: '   \n ' } })
    expect(button()).toBeDisabled()
  })

  it('blocks messages over 2,000 characters and shows the counter in red', () => {
    render(<Checker />)
    fireEvent.change(textarea(), { target: { value: 'a'.repeat(2001) } })
    const counter = screen.getByText('2001 / 2000')
    expect(counter).toHaveClass('text-scam')
    expect(button()).toBeDisabled()
  })

  it('fills the textarea from an example chip', async () => {
    render(<Checker />)
    await userEvent.click(screen.getByRole('button', { name: EXAMPLES[0].label }))
    expect(textarea()).toHaveValue(EXAMPLES[0].text)
  })

  it('checks the message once and shows the verdict', async () => {
    mockedCheck.mockResolvedValue(result('scam'))
    render(<Checker />)
    fireEvent.change(textarea(), { target: { value: 'Send your OTP' } })
    await userEvent.click(button())
    expect(await screen.findByText('Likely scam')).toBeInTheDocument()
    expect(mockedCheck).toHaveBeenCalledTimes(1)
    expect(mockedCheck.mock.calls[0][0]).toBe('Send your OTP')
  })

  it('ignores a slow earlier response once a newer check has finished', async () => {
    const first = deferred<CheckResult>()
    const second = deferred<CheckResult>()
    mockedCheck.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    render(<Checker />)
    fireEvent.change(textarea(), { target: { value: 'first message' } })
    fireEvent.click(button())
    fireEvent.change(textarea(), { target: { value: 'second message' } })
    fireEvent.click(button())
    second.resolve(result('legit', 'second'))
    expect(await screen.findByText('Looks legitimate')).toBeInTheDocument()
    first.resolve(result('scam', 'first'))
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByText('Likely scam')).toBeNull()
  })

  it('shows a friendly error with a retry that re-submits', async () => {
    mockedCheck.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(result('legit'))
    render(<Checker />)
    fireEvent.change(textarea(), { target: { value: 'hello' } })
    await userEvent.click(button())
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("Couldn't check right now")
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(mockedCheck).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Looks legitimate')).toBeInTheDocument()
  })
})
