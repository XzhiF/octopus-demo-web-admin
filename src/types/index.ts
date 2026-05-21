export interface MenuItem {
  id: string
  label: string
  icon?: string
  children?: MenuItem[]
  path?: string
}

export interface TabItem {
  id: string
  label: string
  path: string
  closable: boolean
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  logout: () => void
}

export interface TabState {
  tabs: TabItem[]
  activeTabId: string | null
  addTab: (tab: TabItem) => void
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
}