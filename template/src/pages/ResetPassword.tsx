import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert, AuthCard, Button, Field } from '@/components/ui'
import { api } from '@/lib/api'
import { useAction } from '@/lib/useAction'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState((useLocation().state as { email?: string } | null)?.email ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const { pending, error, run } = useAction()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => { await api.auth.resetPassword({ email, code, new_password: password }); navigate('/login', { replace: true }) })
  }

  return (
    <AuthCard title="Reset password">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Code" required maxLength={6} minLength={6} pattern="[A-Za-z0-9]{6}" value={code} onChange={(e) => setCode(e.target.value)} />
        <Field label="New password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={pending} className="w-full">Reset password</Button>
      </form>
      <Link className="text-sm text-indigo-600" to="/login">Back to sign in</Link>
    </AuthCard>
  )
}
