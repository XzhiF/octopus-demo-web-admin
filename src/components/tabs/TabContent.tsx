'use client'

import { useTabStore } from '@/stores/tabs'

const PAGE_CONTENT: Record<string, { title: string; description: string }> = {
  home: {
    title: 'Welcome to Octopus Admin',
    description: 'Your enterprise management command center. Navigate using the sidebar to explore modules.',
  },
  dashboard: {
    title: 'Dashboard',
    description: 'System overview and key performance indicators at a glance.',
  },
  users: {
    title: 'User Management',
    description: 'Create, edit, and manage user accounts and access profiles.',
  },
  roles: {
    title: 'Role Management',
    description: 'Define roles and configure role-based access control policies.',
  },
  permissions: {
    title: 'Permission Management',
    description: 'Granular permission configuration for all system resources.',
  },
  articles: {
    title: 'Articles',
    description: 'Publish, edit, and organize content articles.',
  },
  categories: {
    title: 'Categories',
    description: 'Manage content taxonomy and categorization structure.',
  },
  media: {
    title: 'Media Library',
    description: 'Upload, organize, and manage media assets.',
  },
  logs: {
    title: 'System Logs',
    description: 'Review audit trails, error logs, and system activity records.',
  },
  metrics: {
    title: 'Performance Metrics',
    description: 'Monitor system health, response times, and resource utilization.',
  },
  alerts: {
    title: 'Alert Rules',
    description: 'Configure threshold-based alert rules and notification channels.',
  },
  settings: {
    title: 'Settings',
    description: 'Application configuration, preferences, and system parameters.',
  },
}

export function TabContent() {
  const activeTabId = useTabStore((s) => s.activeTabId)
  const page = PAGE_CONTENT[activeTabId ?? 'home'] ?? { title: activeTabId ?? 'Unknown', description: '' }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-bold text-white">{page.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{page.description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTabId === 'home' ? (
            <>
              <StatCard label="Active Users" value="1,284" trend="+12%" />
              <StatCard label="System Uptime" value="99.97%" trend="stable" />
              <StatCard label="Pending Tasks" value="23" trend="-5%" />
              <StatCard label="Deployments" value="142" trend="+8%" />
              <StatCard label="Incidents" value="0" trend="clear" />
              <StatCard label="Storage Used" value="67.2 GB" trend="+2%" />
            </>
          ) : (
            <>
              <PlaceholderBlock label="Data Table" />
              <PlaceholderBlock label="Actions Panel" />
              <PlaceholderBlock label="Filters" />
            </>
          )}
        </div>
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