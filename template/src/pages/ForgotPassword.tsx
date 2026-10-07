import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, AuthCard, Button, Field } from '@/components/ui'
import { api } from '@/lib/api'
import { useAction } from '@/lib/useAction'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const { pending, error, run } = useAction()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => { await api.auth.forgotPassword(email); navigate('/reset-password', { state: { email } }) })
  }

  return (
    <AuthCard title="Forgot password" subtitle="We'll email you a reset code">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={pending} className="w-full">Send code</Button>
      </form>
      <Link className="text-sm text-indigo-600" to="/login">Back to sign in</Link>
    </AuthCard>
  )
}
