'use client'

import { useTabStore } from '@/stores/tabs'
import { useAuthStore } from '@/stores/auth'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-slate-900/60 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white">Octopus Admin Console</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-400 ring-1 ring-indigo-500/30">
            {user?.name?.charAt(0) ?? '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}