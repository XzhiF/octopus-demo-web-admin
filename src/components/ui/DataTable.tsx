'use client'

import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T, index: number) => ReactNode
}

export interface DataTablePagination {
  page: number
  size: number
  total: number
  onChange: (page: number, size: number) => void
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  emptyText?: string
  pagination?: DataTablePagination
  rowActions?: (row: T) => ReactNode
  rowActionsTitle?: string
  onRowClick?: (row: T) => void
  sizeOptions?: number[]
}

const ALIGN_CLASS: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = '暂无数据',
  pagination,
  rowActions,
  rowActionsTitle = '操作',
  onRowClick,
  sizeOptions = [10, 20, 50, 100],
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.size)) : 1

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-slate-400">
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className={`px-4 py-3 font-medium ${ALIGN_CLASS[column.align ?? 'left']}`}
                >
                  {column.title}
                </th>
              ))}
              {rowActions ? (
                <th className="px-4 py-3 text-right font-medium">{rowActionsTitle}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  加载中...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = rowKey(row)
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-white/5 last:border-b-0 ${
                      onRowClick ? 'cursor-pointer hover:bg-white/5' : ''
                    } ${loading ? 'opacity-60' : ''}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-slate-200 ${ALIGN_CLASS[column.align ?? 'left']}`}
                      >
                        {column.render ? column.render(row, index) : null}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="px-4 py-3 text-right">{rowActions(row)}</td>
                    ) : null}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-xs text-slate-400">
          <span>
            共 {pagination.total} 条 · 第 {pagination.page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1">
              每页
              <select
                value={pagination.size}
                onChange={(event) => pagination.onChange(1, Number(event.target.value))}
                className="rounded-md border border-white/10 bg-slate-900 px-1 py-1 text-slate-200"
              >
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              条
            </label>
            <button
              type="button"
              onClick={() => pagination.onChange(pagination.page - 1, pagination.size)}
              disabled={pagination.page <= 1 || loading}
              className="rounded-md border border-white/10 px-2 py-1 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => pagination.onChange(pagination.page + 1, pagination.size)}
              disabled={pagination.page >= totalPages || loading}
              className="rounded-md border border-white/10 px-2 py-1 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
