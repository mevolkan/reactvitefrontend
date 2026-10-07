import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Alert, AuthCard, Button, Field } from '@/components/ui'
import { useAction } from '@/lib/useAction'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone_number: '', password: '' })
  const { pending, error, run } = useAction()
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await register({ ...form, phone_number: form.phone_number || null })
      navigate('/verify-email', { replace: true }) // backend emails a code on register
    })
  }

  return (
    <AuthCard title="Create account">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Name" required value={form.name} onChange={set('name')} autoComplete="name" />
        <Field label="Email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        <Field label="Phone (optional)" type="tel" value={form.phone_number} onChange={set('phone_number')} autoComplete="tel" />
        <Field label="Password" type="password" required minLength={8} value={form.password} onChange={set('password')} autoComplete="new-password" />
        <Button type="submit" disabled={pending} className="w-full">{pending ? 'Creating…' : 'Create account'}</Button>
      </form>
      <p className="text-sm text-slate-500">Already have an account? <Link className="text-indigo-600" to="/login">Sign in</Link></p>
    </AuthCard>
  )
}
