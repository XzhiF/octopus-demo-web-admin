'use client'

import { useState } from 'react'
import type { MenuItem } from '@/types'
import { MENU_TREE } from '@/lib/menu-data'
import { useTabStore } from '@/stores/tabs'

function MenuItemComponent({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const [expanded, setExpanded] = useState(false)
  const addTab = useTabStore((s) => s.addTab)
  const hasChildren = item.children && item.children.length > 0

  const handleClick = () => {
    if (hasChildren) {
      setExpanded((prev) => !prev)
    } else if (item.path) {
      addTab({
        id: item.id,
        label: item.label,
        path: item.path,
        closable: item.id !== 'home',
      })
    }
  }

  return (
    <li>
      <button
        onClick={handleClick}
        className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
          depth === 0
            ? 'text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white'
            : 'text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`}
      >
        {item.icon && <span className="shrink-0 text-base">{item.icon}</span>}
        <span className="truncate">{item.label}</span>
        {hasChildren && (
          <span
            className={`ml-auto shrink-0 text-xs transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
          >
            ▸
          </span>
        )}
      </button>

      {hasChildren && expanded && (
        <ul className="mt-1 space-y-0.5 pl-4">
          {item.children!.map((child) => (
            <MenuItemComponent key={child.id} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-white/5 bg-slate-900/80">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-lg shadow-md shadow-indigo-500/20">
          🐙
        </span>
        <span className="text-sm font-bold tracking-tight text-white">Octopus Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {MENU_TREE.map((item) => (
          <MenuItemComponent key={item.id} item={item} />
        ))}
      </nav>

      <div className="border-t border-white/5 px-4 py-3">
        <p className="text-xs text-slate-600">v0.1.0 prototype</p>
      </div>
    </aside>
  )
}