import { create } from 'zustand'
import type { User, AuthState } from '@/types'

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Morgan', email: 'admin@octopus.io', role: 'Administrator', avatar: undefined },
  { id: '2', name: 'Jane Smith', email: 'user@octopus.io', role: 'Operator', avatar: undefined },
]

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (email: string, password: string) => {
    const matched = MOCK_USERS.find((u) => u.email === email)
    if (matched && password === 'demo123') {
      set({ user: matched, isAuthenticated: true })
      return true
    }
    return false
  },
  logout: () => {
    set({ user: null, isAuthenticated: false })
  },
}))