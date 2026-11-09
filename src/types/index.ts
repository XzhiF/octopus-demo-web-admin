export interface Role {
  id?: number
  name?: string
  code: string
}

export interface User {
  id: number
  username: string
  nickname: string
  roles: Role[]
}

/** Mirrors backend MenuVO: id, name, path, icon, children. */
export interface MenuItem {
  id: number
  name: string
  path?: string
  icon?: string
  children?: MenuItem[]
}

/** Mirrors backend AuthVO returned by POST /api/auth/login. */
export interface AuthPayload {
  token: string
  tokenType: string
  expiresInSeconds: number
  user: User
  permissions: string[]
}

/** Mirrors backend CurrentUserVO returned by GET /api/auth/me. */
export interface CurrentUser {
  user: User
  roles: string[]
  permissions: string[]
}

/** Mirrors backend R wrapper: code, data, msg, timestamp. */
export interface ApiResponse<T> {
  code: number
  data: T
  msg: string
  timestamp: number
}

export interface TabItem {
  id: string
  label: string
  path: string
  closable: boolean
}

export interface AuthState {
  token: string | null
  tokenType: string
  expiresInSeconds: number
  user: User | null
  permissions: string[]
  menus: MenuItem[]
  isAuthenticated: boolean
  isReady: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  restore: () => Promise<void>
  loadMenus: () => Promise<void>
}

export interface TabState {
  tabs: TabItem[]
  activeTabId: string | null
  addTab: (tab: TabItem) => void
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
}
