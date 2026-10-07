import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setUnauthorizedHandler, tokenStore } from '@/lib/api'
import type { LoginRequest, RegisterRequest, User } from '@/lib/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (d: LoginRequest) => Promise<User>
  register: (d: RegisterRequest) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => !!tokenStore.get())

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); return }
    try { setUser(await api.auth.me()) } catch { tokenStore.clear(); setUser(null) }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => { tokenStore.clear(); setUser(null) })
    // `loading` starts true only when a token exists, so skip the fetch otherwise.
    if (tokenStore.get()) {
      api.auth.me().then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false))
    }
    return () => setUnauthorizedHandler(null)
  }, [])

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    refresh,
    login: async (d) => { const u = await api.auth.login(d); setUser(u); return u },
    register: async (d) => { const u = await api.auth.register(d); setUser(u); return u },
    logout: async () => { await api.auth.logout().catch(() => {}); setUser(null) },
  }), [user, loading, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
