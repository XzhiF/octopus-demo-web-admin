'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { LoginForm } from '@/components/login/LoginForm'
import { AdminLayout } from '@/components/layout/AdminLayout'

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isReady = useAuthStore((s) => s.isReady)
  const restore = useAuthStore((s) => s.restore)

  useEffect(() => {
    void restore()
  }, [restore])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-sm text-slate-400">
        正在加载...
      </div>
    )
  }

  return isAuthenticated ? <AdminLayout /> : <LoginForm />
}
