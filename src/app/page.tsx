'use client'

import { useAuthStore } from '@/stores/auth'
import { LoginForm } from '@/components/login/LoginForm'
import { AdminLayout } from '@/components/layout/AdminLayout'

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return isAuthenticated ? <AdminLayout /> : <LoginForm />
}