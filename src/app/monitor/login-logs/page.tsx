'use client'

import { useCallback, useEffect, useState } from 'react'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { inputClass, selectClass } from '@/components/ui/FormField'
import { listLoginLogs, type LoginLogVO } from '@/lib/api/logs'

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : '查询失败'
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

/** datetime-local gives `YYYY-MM-DDTHH:mm`; the backend expects ISO local date-time. */
function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined
  return value.length === 16 ? `${value}:00` : value
}

export default function LoginLogsPage() {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameFilter, setUsernameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 0 | 1>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [rows, setRows] = useState<LoginLogVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listLoginLogs({
        page,
        size,
        username: usernameFilter || undefined,
        status: statusFilter === '' ? undefined : statusFilter,
        from: toIsoDateTime(from),
        to: toIsoDateTime(to),
      })
      setRows(result.list)
      setTotal(result.count)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [page, size, usernameFilter, statusFilter, from, to])

  useEffect(() => {
    void load()
  }, [load])

  const search = () => {
    setPage(1)
    setUsernameFilter(usernameInput.trim())
  }

  const resetFilters = () => {
    setUsernameInput('')
    setUsernameFilter('')
    setStatusFilter('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const columns: DataTableColumn<LoginLogVO>[] = [
    {
      key: 'username',
      title: '用户名',
      width: '160px',
      render: (row) => <span className="font-medium text-white">{row.username || '-'}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row) =>
        row.status === 1 ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
            成功
          </span>
        ) : (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
            失败
          </span>
        ),
    },
    {
      key: 'message',
      title: '消息',
      render: (row) => (
        <span
          className={`block max-w-xs truncate ${row.status === 0 ? 'text-red-300' : ''}`}
          title={row.message ?? ''}
        >
          {row.message || '-'}
        </span>
      ),
    },
    { key: 'ip', title: 'IP', width: '150px', render: (row) => row.ip || '-' },
    {
      key: 'userAgent',
      title: 'User-Agent',
      render: (row) => (
        <span className="block max-w-md truncate text-slate-400" title={row.userAgent ?? ''}>
          {row.userAgent || '-'}
        </span>
      ),
    },
    {
      key: 'loginAt',
      title: '登录时间',
      width: '180px',
      render: (row) => formatDateTime(row.loginAt),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">登录日志</h1>
        <p className="mt-1 text-sm text-slate-400">查看登录成功与失败记录，按时间倒序</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={usernameInput}
          onChange={(event) => setUsernameInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') search()
          }}
          placeholder="按用户名搜索"
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            const value = event.target.value
            setStatusFilter(value === '' ? '' : value === '1' ? 1 : 0)
            setPage(1)
          }}
          className={`${selectClass} w-28`}
        >
          <option value="">全部状态</option>
          <option value="1">成功</option>
          <option value="0">失败</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-slate-400">
          从
          <input
            type="datetime-local"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value)
              setPage(1)
            }}
            className={`${inputClass} w-48`}
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-400">
          到
          <input
            type="datetime-local"
            value={to}
            onChange={(event) => {
              setTo(event.target.value)
              setPage(1)
            }}
            className={`${inputClass} w-48`}
          />
        </label>
        <button
          type="button"
          onClick={search}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          查询
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/10"
        >
          重置
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        loading={loading}
        emptyText="暂无登录日志"
        rowClassName={(row) => (row.status === 0 ? 'bg-red-500/5' : undefined)}
        pagination={{
          page,
          size,
          total,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setSize(nextSize)
          },
        }}
      />
    </div>
  )
}
