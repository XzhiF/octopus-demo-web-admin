'use client'

import { useTabStore } from '@/stores/tabs'

export function TabContent() {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const isHome = !activeTabId || activeTabId === 'home'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        {isHome ? (
          <>
            <h1 className="text-xl font-bold text-white">Welcome to Octopus Admin</h1>
            <p className="mt-2 text-sm text-slate-400">
              Your enterprise management command center. Navigate using the sidebar to explore modules.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Active Users" value="1,284" trend="+12%" />
              <StatCard label="System Uptime" value="99.97%" trend="stable" />
              <StatCard label="Pending Tasks" value="23" trend="-5%" />
              <StatCard label="Deployments" value="142" trend="+8%" />
              <StatCard label="Incidents" value="0" trend="clear" />
              <StatCard label="Storage Used" value="67.2 GB" trend="+2%" />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white">{activeTab?.label ?? 'Unknown'}</h1>
            <p className="mt-2 text-sm text-slate-400">{activeTab?.path}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PlaceholderBlock label="Data Table" />
              <PlaceholderBlock label="Actions Panel" />
              <PlaceholderBlock label="Filters" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  const trendColor = trend.startsWith('+') ? 'text-emerald-400' : trend.startsWith('-') ? 'text-red-400' : 'text-slate-500'

  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className={`mt-0.5 text-xs ${trendColor}`}>{trend}</p>
    </div>
  )
}

function PlaceholderBlock({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm flex items-center justify-center">
      <p className="text-sm text-slate-500">{label} — placeholder</p>
    </div>
  )
}
