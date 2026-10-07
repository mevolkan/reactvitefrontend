import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Requires a logged-in user. Pass `verified` to also require a verified email. */
export function ProtectedRoute({ verified = false }: { verified?: boolean }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (verified && !user.is_email_verified) return <Navigate to="/verify-email" replace />
  return <Outlet />
}

/** Login/register/etc: bounce already-logged-in users to the app. */
export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
