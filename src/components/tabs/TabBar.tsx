'use client'

import { useTabStore } from '@/stores/tabs'

export function TabBar() {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const setActiveTab = useTabStore((s) => s.setActiveTab)
  const removeTab = useTabStore((s) => s.removeTab)

  return (
    <div className="flex h-10 shrink-0 items-end border-b border-white/5 bg-slate-900/40 px-2">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              tab.id === activeTabId
                ? 'bg-white/10 text-white border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.closable && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeTab(tab.id)
                }}
                className="shrink-0 rounded p-0.5 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                aria-label={`Close tab ${tab.label}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}