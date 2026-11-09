'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField, inputClass } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import {
  createConfig,
  deleteConfig,
  listConfigs,
  updateConfig,
  type ConfigVO,
} from '@/lib/api/configs'
import { useAuthStore } from '@/stores/auth'

type Notice = { type: 'success' | 'error'; text: string }

type EditorState = {
  open: boolean
  mode: 'create' | 'edit'
  id?: number
  configKey: string
  configValue: string
  remark: string
}

const EMPTY_EDITOR: EditorState = {
  open: false,
  mode: 'create',
  configKey: '',
  configValue: '',
  remark: '',
}

const KEY_PATTERN = /^[A-Za-z0-9._-]+$/

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : '操作失败'
}

export default function ConfigParamsPage() {
  const permissions = useAuthStore((state) => state.permissions)
  const canAdd = permissions.includes('sys:config:add')
  const canEdit = permissions.includes('sys:config:edit')
  const canDelete = permissions.includes('sys:config:delete')

  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [keyInput, setKeyInput] = useState('')
  const [keyFilter, setKeyFilter] = useState('')

  const [rows, setRows] = useState<ConfigVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR)
  const [saving, setSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState<ConfigVO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listConfigs({
        page,
        size,
        key: keyFilter || undefined,
      })
      setRows(result.list)
      setTotal(result.count)
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [page, size, keyFilter])

  useEffect(() => {
    void load()
  }, [load])

  const search = () => {
    setPage(1)
    setKeyFilter(keyInput.trim())
  }

  const resetFilters = () => {
    setKeyInput('')
    setKeyFilter('')
    setPage(1)
  }

  const openCreate = () => {
    setEditor({ ...EMPTY_EDITOR, open: true, mode: 'create' })
    setEditorError(null)
  }

  const openEdit = (config: ConfigVO) => {
    setEditor({
      open: true,
      mode: 'edit',
      id: config.id,
      configKey: config.configKey,
      configValue: config.configValue ?? '',
      remark: config.remark ?? '',
    })
    setEditorError(null)
  }

  const submitEditor = async () => {
    setEditorError(null)
    const configKey = editor.configKey.trim()
    if (!configKey) {
      setEditorError('参数键不能为空')
      return
    }
    if (!KEY_PATTERN.test(configKey)) {
      setEditorError('参数键只允许字母、数字、点、下划线和短横线')
      return
    }
    if (editor.configValue === '') {
      setEditorError('参数值不能为空')
      return
    }
    setSaving(true)
    try {
      const payload = {
        configKey,
        configValue: editor.configValue,
        remark: editor.remark.trim(),
      }
      if (editor.mode === 'create') {
        await createConfig(payload)
      } else if (editor.id !== undefined) {
        await updateConfig(editor.id, payload)
      }
      setEditor(EMPTY_EDITOR)
      setNotice({ type: 'success', text: editor.mode === 'create' ? '参数已创建' : '参数已更新' })
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
      await deleteConfig(deleting.id)
      setNotice({ type: 'success', text: '参数已删除' })
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) })
    } finally {
      setDeleting(null)
    }
  }

  const columns: DataTableColumn<ConfigVO>[] = [
    { key: 'configKey', title: '参数键', width: '240px', render: (row) => row.configKey },
    {
      key: 'configValue',
      title: '参数值',
      render: (row) => (
        <span className="block max-w-md truncate" title={row.configValue}>
          {row.configValue || '-'}
        </span>
      ),
    },
    { key: 'remark', title: '备注', render: (row) => row.remark || '-' },
    {
      key: 'actions',
      title: '操作',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
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
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">参数设置</h1>
          <p className="mt-1 text-sm text-slate-400">维护运行期 key-value 配置，刷新后生效</p>
        </div>
        {canAdd ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            新增参数
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={keyInput}
          onChange={(event) => setKeyInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') search()
          }}
          placeholder="按参数键搜索"
          className={`${inputClass} max-w-xs`}
        />
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
      />

      <Modal
        open={editor.open}
        title={editor.mode === 'create' ? '新增参数' : '编辑参数'}
        onClose={() => setEditor(EMPTY_EDITOR)}
        onConfirm={() => void submitEditor()}
        confirmLoading={saving}
        confirmText="保存"
      >
        <div className="space-y-3">
          <FormField
            label="参数键"
            htmlFor="config-key"
            required
            hint="仅允许字母、数字、点、下划线和短横线"
          >
            <input
              id="config-key"
              value={editor.configKey}
              onChange={(event) =>
                setEditor((state) => ({ ...state, configKey: event.target.value }))
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="参数值" htmlFor="config-value" required>
            <input
              id="config-value"
              value={editor.configValue}
              onChange={(event) =>
                setEditor((state) => ({ ...state, configValue: event.target.value }))
              }
              className={inputClass}
            />
          </FormField>
          <FormField label="备注" htmlFor="config-remark">
            <input
              id="config-remark"
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
        title="删除参数"
        danger
        message={deleting ? `确定删除参数「${deleting.configKey}」吗？` : ''}
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
