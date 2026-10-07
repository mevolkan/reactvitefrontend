import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Alert, AuthCard, Button, Field } from '@/components/ui'
import { api } from '@/lib/api'
import { useAction } from '@/lib/useAction'

export default function VerifyEmail() {
  const { user, refresh, logout } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const verify = useAction()
  const resend = useAction()

  if (user?.is_email_verified) return <Navigate to="/" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    verify.run(async () => { await api.auth.verifyEmail(code); await refresh(); navigate('/', { replace: true }) })
  }

  return (
    <AuthCard title="Verify your email" subtitle={`Enter the 6-character code sent to ${user?.email}`}>
      <form onSubmit={submit} className="space-y-4">
        {verify.error && <Alert kind="error">{verify.error}</Alert>}
        {resend.error && <Alert kind="error">{resend.error}</Alert>}
        {resend.message && <Alert kind="success">{resend.message}</Alert>}
        <Field label="Code" required maxLength={6} minLength={6} pattern="[A-Za-z0-9]{6}" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="submit" disabled={verify.pending} className="w-full">Verify</Button>
      </form>
      <div className="flex justify-between">
        <Button variant="ghost" disabled={resend.pending} onClick={() => resend.run(async () => (await api.auth.resendVerification()).message)}>Resend code</Button>
        <Button variant="ghost" onClick={() => logout()}>Sign out</Button>
      </div>
    </AuthCard>
  )
}
