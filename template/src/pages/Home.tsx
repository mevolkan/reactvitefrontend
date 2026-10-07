import { useEffect, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'My App'

function HealthBadge() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking')
  useEffect(() => {
    api.health().then(() => setStatus('healthy')).catch(() => setStatus('unhealthy'))
  }, [])
  const color = { checking: 'bg-slate-400', healthy: 'bg-green-500', unhealthy: 'bg-red-500' }[status]
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
      <span className={`h-2 w-2 rounded-full ${color}`} /> API {status}
    </span>
  )
}

/** Replace this page with your app. It's only reachable with a verified, logged-in user. */
export default function Home() {
  const { user, logout } = useAuth()
  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
        <div className="flex items-center gap-4">
          <HealthBadge />
          <Button variant="ghost" onClick={() => logout()}>Sign out</Button>
        </div>
      </header>
      <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="text-lg font-medium">Hello, {user?.name} 👋</h2>
        <p className="mt-1 text-sm text-slate-500">{user?.email} · email verified</p>
      </section>
    </div>
  )
}
