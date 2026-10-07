import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        {...props}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </label>
  )
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const styles = variant === 'primary'
    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
    : 'text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100'
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${styles} ${className}`}
    />
  )
}

export function Alert({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  const c = kind === 'error' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-green-50 text-green-700 ring-green-200'
  return <div role="alert" className={`rounded-lg px-3 py-2 text-sm ring-1 ${c}`}>{children}</div>
}
