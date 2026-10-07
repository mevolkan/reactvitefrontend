import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Alert, AuthCard, Button, Field } from '@/components/ui'
import { useAction } from '@/lib/useAction'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { pending, error, run } = useAction()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => { await login({ email, password }); navigate(from, { replace: true }) })
  }

  return (
    <AuthCard title="Sign in" subtitle="Welcome back">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" required minLength={8} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={pending} className="w-full">{pending ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <div className="flex justify-between text-sm text-indigo-600">
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/register">Create account</Link>
      </div>
    </AuthCard>
  )
}
