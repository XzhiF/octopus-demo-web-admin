'use client'

import { useMemo, useState } from 'react'
import {
  computeCheckStates,
  toOrderedIds,
  toggleNode,
  type CheckState,
  type TreeNodeData,
} from './tree-utils'

export type { TreeNodeData } from './tree-utils'

export interface TreeProps {
  nodes: TreeNodeData[]
  checked: number[]
  onChange: (checkedIds: number[]) => void
  /** Everything expands on first render; users can collapse branches. Defaults to true. */
  defaultExpandAll?: boolean
  /** Disables the whole tree (e.g. while saving). */
  disabled?: boolean
  emptyText?: string
}

const STATE_CLASS: Record<CheckState, string> = {
  checked: 'border-indigo-500 bg-indigo-500 text-white',
  indeterminate: 'border-indigo-500 bg-indigo-500/40 text-white',
  unchecked: 'border-white/20 bg-slate-900/60 text-transparent',
}

function ariaChecked(state: CheckState): 'true' | 'false' | 'mixed' {
  if (state === 'checked') return 'true'
  if (state === 'indeterminate') return 'mixed'
  return 'false'
}

export function Tree({
  nodes,
  checked,
  onChange,
  defaultExpandAll = true,
  disabled = false,
  emptyText = '暂无数据',
}: TreeProps) {
  const [toggled, setToggled] = useState<Set<number>>(() => new Set())
  const checkedSet = useMemo(() => new Set(checked), [checked])
  const states = useMemo(() => computeCheckStates(nodes, checkedSet), [nodes, checkedSet])

  if (nodes.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>
  }

  const toggleExpanded = (id: number) => {
    setToggled((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggle = (id: number, current: CheckState) => {
    if (disabled) return
    const nextSet = toggleNode(nodes, checkedSet, id, current !== 'checked')
    onChange(toOrderedIds(nodes, nextSet))
  }

  const renderNodes = (list: TreeNodeData[], depth: number) =>
    list.map((node) => {
      const state = states.get(node.id) ?? 'unchecked'
      const hasChildren = Boolean(node.children?.length)
      // `toggled` flips each branch away from the default expand state.
      const isCollapsed = defaultExpandAll ? toggled.has(node.id) : !toggled.has(node.id)
      const nodeDisabled = disabled || node.disabled

      return (
        <li key={node.id} role="treeitem" aria-checked={ariaChecked(state)} aria-expanded={hasChildren ? !isCollapsed : undefined}>
          <div
            className="flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-white/5"
            style={{ paddingLeft: depth * 18 }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(node.id)}
                aria-label={isCollapsed ? '展开' : '收起'}
                className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] text-slate-400"
              >
                {isCollapsed ? '▸' : '▾'}
              </button>
            ) : (
              <span className="h-4 w-4 shrink-0" />
            )}

            <button
              type="button"
              role="checkbox"
              aria-checked={ariaChecked(state)}
              disabled={nodeDisabled}
              onClick={() => handleToggle(node.id, state)}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40 ${STATE_CLASS[state]}`}
            >
              {state === 'checked' ? '✓' : state === 'indeterminate' ? '−' : ''}
            </button>

            <button
              type="button"
              disabled={nodeDisabled}
              onClick={() => handleToggle(node.id, state)}
              className={`text-left text-sm disabled:cursor-not-allowed ${
                nodeDisabled ? 'text-slate-500' : 'text-slate-200'
              }`}
            >
              {node.label}
            </button>
          </div>

          {hasChildren && !isCollapsed ? (
            <ul role="group">{renderNodes(node.children ?? [], depth + 1)}</ul>
          ) : null}
        </li>
      )
    })

  return (
    <ul role="tree" className="select-none">
      {renderNodes(nodes, 0)}
    </ul>
  )
}
