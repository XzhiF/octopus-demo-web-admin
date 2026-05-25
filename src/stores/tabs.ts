import { create } from 'zustand'
import type { TabItem, TabState } from '@/types'

const HOME_TAB: TabItem = { id: 'home', label: 'Home', path: '/home', closable: false }

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [HOME_TAB],
  activeTabId: HOME_TAB.id,
  addTab: (tab: TabItem) => {
    const { tabs } = get()
    const existing = tabs.find((t) => t.id === tab.id)
    if (existing) {
      set({ activeTabId: tab.id })
      return
    }
    set({ tabs: [...tabs, tab], activeTabId: tab.id })
  },
  removeTab: (tabId: string) => {
    const { tabs, activeTabId } = get()
    if (tabId === 'home') return
    const remaining = tabs.filter((t) => t.id !== tabId)
    const newActive = activeTabId === tabId
      ? remaining[remaining.length - 1]?.id ?? HOME_TAB.id
      : activeTabId
    set({ tabs: remaining, activeTabId: newActive })
  },
  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId })
  },
}))