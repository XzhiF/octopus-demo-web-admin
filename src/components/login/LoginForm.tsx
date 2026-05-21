'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'

export function LoginForm() {
  const [email, setEmail] = useState('admin@octopus.io')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600))

    const success = login(email, password)
    if (!success) {
      setError('Invalid credentials. Try admin@octopus.io / demo123')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500 text-2xl shadow-lg shadow-indigo-500/30">
            🐙
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Octopus Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Enterprise management platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/10"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/10"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-600 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Demo credentials: admin@octopus.io / demo123
        </p>
      </div>
    </div>
  )
}