'use client'

import { Sidebar } from '@/components/sidebar/Sidebar'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/tabs/TabBar'
import { TabContent } from '@/components/tabs/TabContent'

export function AdminLayout() {
  return (
    <div className="flex h-screen flex-col bg-slate-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <TabBar />
          <TabContent />
        </main>
      </div>
    </div>
  )
}