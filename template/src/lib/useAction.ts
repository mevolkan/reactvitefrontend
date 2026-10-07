import { useState } from 'react'

/** Wraps an async submit handler with pending/error/message state. */
export function useAction() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function run(fn: () => Promise<string | void>) {
    setPending(true); setError(null); setMessage(null)
    try {
      const msg = await fn()
      if (msg) setMessage(msg)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }
  return { pending, error, message, run }
}
