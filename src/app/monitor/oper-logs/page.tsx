'use client'

import { useCallback, useEffect, useState } from 'react'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField, inputClass, selectClass } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { getOperLog, listOperLogs, type OperLogVO } from '@/lib/api/oper-logs'

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : '操作失败'
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

function StatusTag({ status }: { status: number }) {
  return status === 1 ? (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">成功</span>
  ) : (
    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">失败</span>
  )
}

export default function OperLogsPage() {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [operatorInput, setOperatorInput] = useState('')
  const [moduleInput, setModuleInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 0 | 1>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [operatorFilter, setOperatorFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')

  const [rows, setRows] = useState<OperLogVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [detail, setDetail] = useState<OperLogVO | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listOperLogs({
        page,
        size,
        operator: operatorFilter || undefined,
        module: moduleFilter || undefined,
        status: statusFilter === '' ? undefined : statusFilter,
        from: toIsoDateTime(from),
        to: toIsoDateTime(to),
      })
      setRows(result.list)
      setTotal(result.count)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [page, size, operatorFilter, moduleFilter, statusFilter, from, to])

  useEffect(() => {
    void load()
  }, [load])

  const search = () => {
    setPage(1)
    setOperatorFilter(operatorInput.trim())
    setModuleFilter(moduleInput.trim())
  }

  const resetFilters = () => {
    setOperatorInput('')
    setModuleInput('')
    setStatusFilter('')
    setFrom('')
    setTo('')
    setOperatorFilter('')
    setModuleFilter('')
    setPage(1)
  }

  const openDetail = async (row: OperLogVO) => {
    setDetail(row)
    setDetailError(null)
    setDetailLoading(true)
    try {
      setDetail(await getOperLog(row.id))
    } catch (cause) {
      setDetailError(errorMessage(cause))
    } finally {
      setDetailLoading(false)
    }
  }

  const columns: DataTableColumn<OperLogVO>[] = [
    { key: 'operator', title: '操作人', render: (row) => row.operator || '-' },
    { key: 'title', title: '操作', render: (row) => row.title },
    { key: 'module', title: '模块', render: (row) => row.module || '-' },
    {
      key: 'method',
      title: '请求',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">{row.httpMethod || '-'}</span>
          <span className="max-w-xs truncate text-slate-300" title={row.requestUri ?? ''}>
            {row.requestUri || '-'}
          </span>
        </div>
      ),
    },
    { key: 'ip', title: 'IP', render: (row) => row.ip || '-' },
    {
      key: 'durationMs',
      title: '耗时',
      align: 'right',
      render: (row) =>
        row.durationMs === null || row.durationMs === undefined ? '-' : `${row.durationMs} ms`,
    },
    { key: 'status', title: '状态', render: (row) => <StatusTag status={row.status} /> },
    { key: 'createdAt', title: '时间', render: (row) => formatDateTime(row.createdAt) },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">操作日志</h1>
        <p className="mt-1 text-sm text-slate-400">审计关键写操作，参数已脱敏</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={operatorInput}
          onChange={(event) => setOperatorInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') search()
          }}
          placeholder="按操作人搜索"
          className={`${inputClass} max-w-xs`}
        />
        <input
          value={moduleInput}
          onChange={(event) => setModuleInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') search()
          }}
          placeholder="按模块搜索，如 user"
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
        emptyText="暂无操作日志"
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
        rowActions={(row) => (
          <button
            type="button"
            onClick={() => void openDetail(row)}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
          >
            详情
          </button>
        )}
      />

      <Modal
        open={detail !== null}
        title={detail ? `操作详情 · ${detail.title}` : '操作详情'}
        onClose={() => setDetail(null)}
        onCancel={() => setDetail(null)}
        cancelText="关闭"
        width={760}
      >
        {detail ? (
          <div className="space-y-3">
            {detailLoading ? <p className="text-xs text-slate-500">加载中...</p> : null}
            {detailError ? <p className="text-xs text-red-400">{detailError}</p> : null}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <FormField label="操作人">
                <p className="text-slate-200">{detail.operator || '-'}</p>
              </FormField>
              <FormField label="模块">
                <p className="text-slate-200">{detail.module || '-'}</p>
              </FormField>
              <FormField label="请求方法">
                <p className="text-slate-200">{detail.httpMethod || '-'}</p>
              </FormField>
              <FormField label="请求路径">
                <p className="break-all text-slate-200">{detail.requestUri || '-'}</p>
              </FormField>
              <FormField label="IP">
                <p className="text-slate-200">{detail.ip || '-'}</p>
              </FormField>
              <FormField label="耗时">
                <p className="text-slate-200">
                  {detail.durationMs === null || detail.durationMs === undefined
                    ? '-'
                    : `${detail.durationMs} ms`}
                </p>
              </FormField>
              <FormField label="状态">
                <StatusTag status={detail.status} />
              </FormField>
              <FormField label="时间">
                <p className="text-slate-200">{formatDateTime(detail.createdAt)}</p>
              </FormField>
            </div>
            <FormField label="请求参数">
              <pre className="max-h-56 overflow-auto rounded-lg border border-white/5 bg-slate-950/60 p-3 text-xs text-slate-300">
                {detail.params || '-'}
              </pre>
            </FormField>
            <FormField label="异常信息">
              <pre
                className={`max-h-40 overflow-auto rounded-lg border border-white/5 bg-slate-950/60 p-3 text-xs ${
                  detail.errorMsg ? 'text-red-300' : 'text-slate-500'
                }`}
              >
                {detail.errorMsg || '-'}
              </pre>
            </FormField>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
