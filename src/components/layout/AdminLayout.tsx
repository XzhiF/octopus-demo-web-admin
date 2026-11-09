'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/tabs/TabBar'
import { TabContent } from '@/components/tabs/TabContent'
import { fetchConfigValue } from '@/lib/api/configs'

const DEFAULT_SITE_TITLE = 'Octopus 管理平台'

export function AdminLayout() {
  const [siteTitle, setSiteTitle] = useState(DEFAULT_SITE_TITLE)

  useEffect(() => {
    let cancelled = false
    fetchConfigValue('sys.site.title')
      .then((value) => {
        if (!cancelled && value) setSiteTitle(value)
      })
      .catch(() => {
        // Missing parameter or failed request keeps the fallback title.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.title = siteTitle
  }, [siteTitle])

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      <Header title={siteTitle} />
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
