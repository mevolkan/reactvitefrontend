import type {
  HealthResponse, LoginRequest, MessageResponse, RegisterRequest, ResetPasswordRequest, User,
} from './types'

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
const TOKEN_KEY = 'session_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** FastAPI `detail` is a string for HTTPException and a list for 422 validation errors. */
function extractMessage(status: number, body: unknown): string {
  if (status === 429) return 'Too many requests. Please slow down and try again.'
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => `${d.loc?.slice(1).join('.') ?? ''}: ${d.msg ?? ''}`)
      .join('; ')
  }
  return 'Something went wrong'
}

// Called when a request with a token comes back 401 so the auth context can drop the user.
let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn }

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = tokenStore.get()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Login/register return the new session token in the `Authorization` response header.
  const issued = res.headers.get('Authorization')
  if (issued?.toLowerCase().startsWith('bearer ')) tokenStore.set(issued.split(' ')[1])

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(res.status, extractMessage(res.status, data))
  }
  return data as T
}

export const api = {
  health: () => request<HealthResponse>('GET', '/health'),
  auth: {
    register: (d: RegisterRequest) => request<User>('POST', '/auth/register', d),
    login: (d: LoginRequest) => request<User>('POST', '/auth/login', d),
    logout: async () => {
      try { await request<MessageResponse>('POST', '/auth/logout') } finally { tokenStore.clear() }
    },
    me: () => request<User>('GET', '/auth/me'),
    verifyEmail: (code: string) => request<MessageResponse>('POST', '/auth/verify-email', { code }),
    resendVerification: () => request<MessageResponse>('POST', '/auth/resend-verification-email'),
    forgotPassword: (email: string) => request<MessageResponse>('POST', '/auth/forgot-password', { email }),
    resetPassword: (d: ResetPasswordRequest) => request<MessageResponse>('POST', '/auth/reset-password', d),
  },
}
