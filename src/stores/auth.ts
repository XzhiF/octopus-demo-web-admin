import { create } from 'zustand'
import type { AuthPayload, AuthState, CurrentUser, MenuItem } from '@/types'
import { clearToken, getToken, request, saveToken } from '@/lib/api'

const UNAUTHENTICATED = {
  token: null,
  tokenType: 'Bearer',
  expiresInSeconds: 0,
  user: null,
  permissions: [] as string[],
  menus: [] as MenuItem[],
  isAuthenticated: false,
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...UNAUTHENTICATED,
  isReady: false,

  login: async (username: string, password: string) => {
    const payload = await request<AuthPayload>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: false,
      redirectOnUnauthorized: false,
    })
    saveToken(payload.token)
    set({
      token: payload.token,
      tokenType: payload.tokenType,
      expiresInSeconds: payload.expiresInSeconds,
      user: payload.user,
      permissions: payload.permissions,
      isAuthenticated: true,
      isReady: true,
    })
    await get().loadMenus()
    return true
  },

  logout: async () => {
    try {
      await request<void>('/api/auth/logout', { method: 'POST' })
    } catch {
      // Stateless logout — clearing the local session is what matters.
    }
    clearToken()
    set({ ...UNAUTHENTICATED, isReady: true })
  },

  restore: async () => {
    if (get().isAuthenticated) {
      set({ isReady: true })
      return
    }
    const token = getToken()
    if (!token) {
      set({ isReady: true })
      return
    }
    try {
      const me = await request<CurrentUser>('/api/auth/me', { redirectOnUnauthorized: false })
      set({
        token,
        user: me.user,
        permissions: me.permissions,
        isAuthenticated: true,
        isReady: true,
      })
      await get().loadMenus()
    } catch {
      clearToken()
      set({ ...UNAUTHENTICATED, isReady: true })
    }
  },

  loadMenus: async () => {
    try {
      const menus = await request<MenuItem[]>('/api/auth/menus')
      set({ menus })
    } catch {
      set({ menus: [] })
    }
  },
}))
