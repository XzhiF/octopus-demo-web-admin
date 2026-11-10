'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField, inputClass, selectClass } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import {
  createJob,
  deleteJob,
  listJobLogs,
  listJobs,
  pauseJob,
  resumeJob,
  runJob,
  updateJob,
  type JobLogVO,
  type JobVO,
} from '@/lib/api/jobs'
import { useAuthStore } from '@/stores/auth'

type Notice = { type: 'success' | 'error'; text: string }

type EditorState = {
  open: boolean
  mode: 'create' | 'edit'
  id?: number
  jobName: string
  jobGroup: string
  beanName: string
  cron: string
  params: string
  status: number
  remark: string
}

const EMPTY_EDITOR: EditorState = {
  open: false,
  mode: 'create',
  jobName: '',
  jobGroup: 'DEFAULT',
  beanName: '',
  cron: '',
  params: '',
  status: 1,
  remark: '',
}

const CRON_SAMPLES = [
  { label: '每分钟', value: '0 * * * * ?' },
  { label: '每小时', value: '0 0 * * * ?' },
  { label: '每天零点', value: '0 0 0 * * ?' },
]

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

export default function JobsPage() {
  const permissions = useAuthStore((state) => state.permissions)
  const canAdd = permissions.includes('sys:job:add')
  const canEdit = permissions.includes('sys:job:edit')
  const canDelete = permissions.includes('sys:job:delete')
  const canRun = permissions.includes('sys:job:run')

  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [jobNameInput, setJobNameInput] = useState('')
  const [jobNameFilter, setJobNameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 0 | 1>('')

  const [rows, setRows] = useState<JobVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR)
  const [saving, setSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState<JobVO | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)

  const [logOpen, setLogOpen] = useState(false)
  const [logJobId, setLogJobId] = useState<number | ''>('')
  const [logStatus, setLogStatus] = useState<'' | 0 | 1>('')
  const [logFrom, setLogFrom] = useState('')
  const [logTo, setLogTo] = useState('')
  const [logPage, setLogPage] = useState(1)
  const [logSize, setLogSize] = useState(10)
  const [logRows, setLogRows] = useState<JobLogVO[]>([])
  const [logTotal, setLogTotal] = useState(0)
  const [logLoading, setLogLoading] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [logVersion, setLogVersion] = useState(0)
  const [jobOptions, setJobOptions] = useState<JobVO[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listJobs({
        page,
        size,
        jobName: jobNameFilter || undefined,
        status: statusFilter === '' ? undefined : statusFilter,
      })
      setRows(result.list)
      setTotal(result.count)
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [page, size, jobNameFilter, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const loadLogs = useCallback(async () => {
    setLogLoading(true)
    setLogError(null)
    try {
      const result = await listJobLogs({
        page: logPage,
        size: logSize,
        jobId: logJobId === '' ? undefined : logJobId,
        status: logStatus === '' ? undefined : logStatus,
        from: toIsoDateTime(logFrom),
        to: toIsoDateTime(logTo),
      })
      setLogRows(result.list)
      setLogTotal(result.count)
    } catch (error) {
      setLogError(errorMessage(error))
    } finally {
      setLogLoading(false)
    }
  }, [logPage, logSize, logJobId, logStatus, logFrom, logTo, logVersion])

  useEffect(() => {
    if (logOpen) void loadLogs()
  }, [logOpen, loadLogs])

  const search = () => {
    setPage(1)
    setJobNameFilter(jobNameInput.trim())
  }

  const resetFilters = () => {
    setJobNameInput('')
    setJobNameFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const openCreate = () => {
    setEditor({ ...EMPTY_EDITOR, open: true, mode: 'create' })
    setEditorError(null)
  }

  const openEdit = (job: JobVO) => {
    setEditor({
      open: true,
      mode: 'edit',
      id: job.id,
      jobName: job.jobName,
      jobGroup: job.jobGroup,
      beanName: job.beanName,
      cron: job.cron,
      params: job.params ?? '',
      status: job.status,
      remark: job.remark ?? '',
    })
    setEditorError(null)
  }

  const loadJobOptions = useCallback(async () => {
    try {
      const result = await listJobs({ page: 1, size: 100 })
      setJobOptions(result.list)
    } catch {
      // fall back to the rows on the current table page
    }
  }, [])

  const openLogs = (job: JobVO) => {
    void loadJobOptions()
    setLogJobId(job.id)
    setLogStatus('')
    setLogFrom('')
    setLogTo('')
    setLogPage(1)
    setLogOpen(true)
  }

  const submitEditor = async () => {
    setEditorError(null)
    const jobName = editor.jobName.trim()
    const beanName = editor.beanName.trim()
    const cron = editor.cron.trim()
    if (!jobName) {
      setEditorError('任务名称不能为空')
      return
    }
    if (!beanName) {
      setEditorError('Bean 名称不能为空')
      return
    }
    if (!cron) {
      setEditorError('cron 表达式不能为空')
      return
    }
    setSaving(true)
    try {
      const payload = {
        jobName,
        jobGroup: editor.jobGroup.trim() || 'DEFAULT',
        beanName,
        cron,
        params: editor.params.trim() || undefined,
        status: editor.status,
        remark: editor.remark.trim() || undefined,
      }
      if (editor.mode === 'create') {
        await createJob(payload)
      } else if (editor.id !== undefined) {
        await updateJob(editor.id, payload)
      }
      setEditor(EMPTY_EDITOR)
      setNotice({ type: 'success', text: editor.mode === 'create' ? '任务已创建' : '任务已更新' })
      await load()
    } catch (error) {
      setEditorError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteJob(deleting.id)
      setNotice({ type: 'success', text: '任务已删除' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setDeleting(null)
    }
  }

  const toggleStatus = async (job: JobVO) => {
    setActingId(job.id)
    try {
      if (job.status === 1) {
        await pauseJob(job.id)
        setNotice({ type: 'success', text: `任务「${job.jobName}」已暂停` })
      } else {
        await resumeJob(job.id)
        setNotice({ type: 'success', text: `任务「${job.jobName}」已恢复` })
      }
      await load()
      if (logOpen) setLogVersion((version) => version + 1)
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setActingId(null)
    }
  }

  const triggerNow = async (job: JobVO) => {
    setActingId(job.id)
    try {
      await runJob(job.id)
      setNotice({ type: 'success', text: `任务「${job.jobName}」已触发一次执行` })
      await load()
      if (logOpen) setLogVersion((version) => version + 1)
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setActingId(null)
    }
  }

  const columns: DataTableColumn<JobVO>[] = [
    {
      key: 'jobName',
      title: '任务名',
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.jobName}</p>
          {row.remark ? <p className="mt-0.5 text-xs text-slate-500">{row.remark}</p> : null}
        </div>
      ),
    },
    { key: 'jobGroup', title: '分组', render: (row) => row.jobGroup || '-' },
    { key: 'beanName', title: 'Bean', render: (row) => row.beanName },
    {
      key: 'cron',
      title: 'cron',
      render: (row) => <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">{row.cron}</code>,
    },
    {
      key: 'status',
      title: '状态',
      render: (row) => {
        const active = row.status === 1
        if (!canEdit) {
          return active ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
              启用
            </span>
          ) : (
            <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-300">
              停用
            </span>
          )
        }
        return (
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={`${row.jobName} ${active ? '停用' : '启用'}`}
            title={active ? '点击停用' : '点击启用'}
            onClick={() => void toggleStatus(row)}
            disabled={actingId === row.id}
            className="inline-flex items-center gap-2 rounded-md py-0.5 pr-1 transition disabled:opacity-50"
          >
            <span
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                active ? 'bg-emerald-500/80' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  active ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </span>
            <span className={`text-xs ${active ? 'text-emerald-300' : 'text-slate-300'}`}>
              {active ? '启用' : '停用'}
            </span>
          </button>
        )
      },
    },
    { key: 'lastRunAt', title: '最近执行', render: (row) => formatDateTime(row.lastRunAt) },
  ]

  const logColumns: DataTableColumn<JobLogVO>[] = [
    { key: 'jobName', title: '任务名', render: (row) => row.jobName || '-' },
    { key: 'startedAt', title: '开始', render: (row) => formatDateTime(row.startedAt) },
    { key: 'finishedAt', title: '结束', render: (row) => formatDateTime(row.finishedAt) },
    {
      key: 'durationMs',
      title: '耗时',
      align: 'right',
      render: (row) => (row.durationMs === null || row.durationMs === undefined ? '-' : `${row.durationMs} ms`),
    },
    {
      key: 'status',
      title: '状态',
      render: (row) =>
        row.status === 1 ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
            成功
          </span>
        ) : (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">失败</span>
        ),
    },
    {
      key: 'triggerType',
      title: '触发方式',
      render: (row) => (row.triggerType === 'manual' ? '手动' : 'cron'),
    },
    {
      key: 'message',
      title: '消息',
      render: (row) => (
        <span
          className={`block max-w-md truncate ${row.status === 0 ? 'text-red-300' : ''}`}
          title={row.message ?? ''}
        >
          {row.message || '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">定时任务</h1>
          <p className="mt-1 text-sm text-slate-400">管理 cron 任务、暂停恢复与执行日志</p>
        </div>
        {canAdd ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            新建任务
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={jobNameInput}
          onChange={(event) => setJobNameInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') search()
          }}
          placeholder="按任务名搜索"
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            const value = event.target.value
            setStatusFilter(value === '' ? '' : value === '1' ? 1 : 0)
            setPage(1)
          }}
          className={`${selectClass} w-32`}
        >
          <option value="">全部状态</option>
          <option value="1">启用</option>
          <option value="0">停用</option>
        </select>
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

      {notice ? (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            notice.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        loading={loading}
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
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => openLogs(row)}
              className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
            >
              日志
            </button>
            {canRun ? (
              <button
                type="button"
                onClick={() => void triggerNow(row)}
                disabled={actingId === row.id}
                className="rounded-md border border-indigo-500/30 px-2 py-1 text-xs text-indigo-300 transition hover:bg-indigo-500/10 disabled:opacity-40"
              >
                立即执行
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
              >
                编辑
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={() => setDeleting(row)}
                className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
              >
                删除
              </button>
            ) : null}
          </div>
        )}
      />

      <Modal
        open={editor.open}
        title={editor.mode === 'create' ? '新建任务' : '编辑任务'}
        onClose={() => setEditor(EMPTY_EDITOR)}
        onConfirm={() => void submitEditor()}
        confirmLoading={saving}
        confirmText="保存"
        width={560}
      >
        <div className="space-y-3">
          <FormField label="任务名" htmlFor="job-name" required>
            <input
              id="job-name"
              value={editor.jobName}
              onChange={(event) =>
                setEditor((state) => ({ ...state, jobName: event.target.value }))
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="分组" htmlFor="job-group" hint="留空默认 DEFAULT">
            <input
              id="job-group"
              value={editor.jobGroup}
              onChange={(event) =>
                setEditor((state) => ({ ...state, jobGroup: event.target.value }))
              }
              className={inputClass}
            />
          </FormField>
          <FormField
            label="Bean 名称"
            htmlFor="job-bean"
            required
            hint="需为实现了 ScheduledTask 的 Spring Bean"
          >
            <input
              id="job-bean"
              value={editor.beanName}
              onChange={(event) =>
                setEditor((state) => ({ ...state, beanName: event.target.value }))
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="cron 表达式" htmlFor="job-cron" required>
            <input
              id="job-cron"
              value={editor.cron}
              onChange={(event) => setEditor((state) => ({ ...state, cron: event.target.value }))}
              placeholder="0/5 * * * * ?"
              className={`${inputClass} font-mono`}
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CRON_SAMPLES.map((sample) => (
                <button
                  key={sample.value}
                  type="button"
                  onClick={() => setEditor((state) => ({ ...state, cron: sample.value }))}
                  className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                  title={sample.value}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="参数" htmlFor="job-params" hint="传给 ScheduledTask#execute 的参数，可留空">
            <input
              id="job-params"
              value={editor.params}
              onChange={(event) =>
                setEditor((state) => ({ ...state, params: event.target.value }))
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="状态" htmlFor="job-status">
            <select
              id="job-status"
              value={editor.status}
              onChange={(event) =>
                setEditor((state) => ({ ...state, status: Number(event.target.value) }))
              }
              className={selectClass}
            >
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </FormField>
          <FormField label="备注" htmlFor="job-remark">
            <input
              id="job-remark"
              value={editor.remark}
              onChange={(event) =>
                setEditor((state) => ({ ...state, remark: event.target.value }))
              }
              className={inputClass}
            />
          </FormField>
          {editorError ? <p className="text-xs text-red-400">{editorError}</p> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="删除任务"
        danger
        message={
          deleting
            ? `确定删除任务「${deleting.jobName}」吗？删除后对应触发器会被移除。`
            : ''
        }
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      <Modal
        open={logOpen}
        title="执行日志"
        onClose={() => setLogOpen(false)}
        onCancel={() => setLogOpen(false)}
        cancelText="关闭"
        width={960}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={logJobId}
              onChange={(event) => {
                setLogJobId(event.target.value === '' ? '' : Number(event.target.value))
                setLogPage(1)
              }}
              className={`${selectClass} w-48`}
            >
              <option value="">全部任务</option>
              {(jobOptions.length > 0 ? jobOptions : rows).map((job) => (
                <option key={job.id} value={job.id}>
                  {job.jobName}
                </option>
              ))}
            </select>
            <select
              value={logStatus}
              onChange={(event) => {
                const value = event.target.value
                setLogStatus(value === '' ? '' : value === '1' ? 1 : 0)
                setLogPage(1)
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
                value={logFrom}
                onChange={(event) => {
                  setLogFrom(event.target.value)
                  setLogPage(1)
                }}
                className={`${inputClass} w-48`}
              />
            </label>
            <label className="flex items-center gap-1 text-xs text-slate-400">
              到
              <input
                type="datetime-local"
                value={logTo}
                onChange={(event) => {
                  setLogTo(event.target.value)
                  setLogPage(1)
                }}
                className={`${inputClass} w-48`}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setLogStatus('')
                setLogFrom('')
                setLogTo('')
                setLogPage(1)
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/10"
            >
              重置
            </button>
          </div>

          {logError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {logError}
            </div>
          ) : null}

          <DataTable
            columns={logColumns}
            data={logRows}
            rowKey={(row) => row.id}
            loading={logLoading}
            emptyText="暂无执行日志"
            sizeOptions={[10, 20, 50]}
            rowClassName={(row) => (row.status === 0 ? 'bg-red-500/5' : undefined)}
            pagination={{
              page: logPage,
              size: logSize,
              total: logTotal,
              onChange: (nextPage, nextSize) => {
                setLogPage(nextPage)
                setLogSize(nextSize)
              },
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
