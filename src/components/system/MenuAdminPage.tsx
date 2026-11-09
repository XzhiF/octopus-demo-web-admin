'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField, inputClass, selectClass } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { ApiError } from '@/lib/api'
import {
  createMenu,
  deleteMenu,
  fetchMenuTree,
  updateMenu,
  type MenuPayload,
  type MenuType,
  type MenuVO,
} from '@/lib/api/menus'

interface FlatMenu extends MenuVO {
  depth: number
}

const TYPE_LABEL: Record<MenuType, string> = {
  catalog: '目录',
  menu: '菜单',
  button: '按钮',
}

const TYPE_BADGE: Record<MenuType, string> = {
  catalog: 'bg-indigo-500/15 text-indigo-300',
  menu: 'bg-emerald-500/15 text-emerald-300',
  button: 'bg-amber-500/15 text-amber-300',
}

function flatten(nodes: MenuVO[], depth = 0): FlatMenu[] {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flatten(node.children ?? [], depth + 1),
  ])
}

function findMenu(nodes: MenuVO[], id: number): MenuVO | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const hit = node.children ? findMenu(node.children, id) : undefined
    if (hit) return hit
  }
  return undefined
}

function collectSubtreeIds(node: MenuVO): number[] {
  return [node.id, ...(node.children ?? []).flatMap(collectSubtreeIds)]
}

interface FormState {
  id: number | null
  parentId: string
  name: string
  type: MenuType
  path: string
  icon: string
  perms: string
  sort: string
  status: string
}

const EMPTY_FORM: FormState = {
  id: null,
  parentId: '',
  name: '',
  type: 'menu',
  path: '',
  icon: '',
  perms: '',
  sort: '0',
  status: '1',
}

function toForm(node: MenuVO): FormState {
  return {
    id: node.id,
    parentId: node.parentId && node.parentId > 0 ? String(node.parentId) : '',
    name: node.name,
    type: node.type,
    path: node.path ?? '',
    icon: node.icon ?? '',
    perms: node.perms ?? '',
    sort: String(node.sort ?? 0),
    status: String(node.status ?? 1),
  }
}

export function MenuAdminPage() {
  const [tree, setTree] = useState<MenuVO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuVO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTree(await fetchMenuTree())
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '加载菜单失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => flatten(tree), [tree])

  const parentOptions = useMemo(() => {
    if (!form) return []
    const wanted = form.type === 'menu' ? 'catalog' : form.type === 'button' ? 'menu' : null
    if (!wanted) return []
    const excluded = new Set<number>()
    if (form.id !== null) {
      const editing = findMenu(tree, form.id)
      if (editing) collectSubtreeIds(editing).forEach((id) => excluded.add(id))
    }
    return rows.filter((row) => row.type === wanted && !excluded.has(row.id))
  }, [form, rows, tree])

  const updateForm = (patch: Partial<FormState>) => {
    setForm((current) => (current ? { ...current, ...patch } : current))
  }

  const openCreate = () => {
    setFieldErrors({})
    setFormError(null)
    setForm({ ...EMPTY_FORM })
  }

  const openEdit = (row: FlatMenu) => {
    setFieldErrors({})
    setFormError(null)
    setForm(toForm(row))
  }

  const submit = async () => {
    if (!form) return
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = '请输入名称'
    if (form.type === 'menu' && !form.path.trim()) nextErrors.path = '菜单类型必须填写路径'
    if (form.type === 'button' && !form.perms.trim()) nextErrors.perms = '按钮类型必须填写权限码'
    if (form.type === 'button' && !form.parentId) nextErrors.parentId = '按钮必须挂在菜单下'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload: MenuPayload = {
      parentId: form.type === 'catalog' || !form.parentId ? null : Number(form.parentId),
      name: form.name.trim(),
      type: form.type,
      sort: Number(form.sort) || 0,
      status: Number(form.status),
      path: form.type === 'button' ? undefined : form.path.trim() || undefined,
      icon: form.type === 'button' ? undefined : form.icon.trim() || undefined,
      perms: form.type === 'catalog' ? undefined : form.perms.trim() || undefined,
    }

    setSaving(true)
    setFormError(null)
    try {
      if (form.id !== null) {
        await updateMenu(form.id, payload)
      } else {
        await createMenu(payload)
      }
      setForm(null)
      await load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMenu(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '删除失败')
      throw err
    }
  }

  const columns: DataTableColumn<FlatMenu>[] = [
    {
      key: 'name',
      title: '名称',
      render: (row) => (
        <span
          className={row.type === 'button' ? 'text-slate-400' : 'text-slate-100'}
          style={{ paddingLeft: row.depth * 18 }}
        >
          {row.depth > 0 ? <span className="mr-1 text-slate-600">└</span> : null}
          {row.name}
        </span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: '80px',
      render: (row) => (
        <span className={`rounded px-2 py-0.5 text-xs ${TYPE_BADGE[row.type]}`}>
          {TYPE_LABEL[row.type] ?? row.type}
        </span>
      ),
    },
    {
      key: 'path',
      title: '路径',
      render: (row) => <span className="font-mono text-xs text-slate-400">{row.path || '—'}</span>,
    },
    {
      key: 'perms',
      title: '权限码',
      render: (row) => <span className="font-mono text-xs text-slate-400">{row.perms || '—'}</span>,
    },
    { key: 'sort', title: '排序', width: '64px', align: 'center', render: (row) => row.sort ?? 0 },
    {
      key: 'status',
      title: '状态',
      width: '72px',
      align: 'center',
      render: (row) =>
        row.status === 0 ? (
          <span className="text-xs text-slate-500">停用</span>
        ) : (
          <span className="text-xs text-emerald-400">启用</span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">菜单管理</h1>
          <p className="mt-1 text-sm text-slate-400">维护目录、菜单与按钮三级结构及权限码。</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          新增
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
        emptyText="暂无菜单"
        rowActions={(row) => (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="text-xs text-indigo-300 transition hover:text-indigo-200"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="text-xs text-red-300 transition hover:text-red-200"
            >
              删除
            </button>
          </div>
        )}
      />

      <Modal
        open={form !== null}
        title={form?.id ? '编辑菜单' : '新增菜单'}
        onClose={() => setForm(null)}
        onConfirm={() => void submit()}
        confirmLoading={saving}
        width={560}
      >
        {form ? (
          <div className="space-y-3">
            {formError ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {formError}
              </div>
            ) : null}

            <FormField label="类型" required>
              <select
                value={form.type}
                onChange={(event) => updateForm({ type: event.target.value as MenuType, parentId: '' })}
                className={selectClass}
              >
                <option value="catalog">目录</option>
                <option value="menu">菜单</option>
                <option value="button">按钮</option>
              </select>
            </FormField>

            <FormField label="名称" required error={fieldErrors.name}>
              <input
                value={form.name}
                onChange={(event) => updateForm({ name: event.target.value })}
                className={inputClass}
                placeholder="例如：用户管理"
              />
            </FormField>

            {form.type !== 'catalog' ? (
              <FormField
                label={form.type === 'button' ? '所属菜单' : '父目录'}
                required={form.type === 'button'}
                error={fieldErrors.parentId}
                hint={form.type === 'button' ? '按钮只能挂在菜单下' : '菜单可挂在目录下，也可置为根节点'}
              >
                <select
                  value={form.parentId}
                  onChange={(event) => updateForm({ parentId: event.target.value })}
                  className={selectClass}
                >
                  <option value="">{form.type === 'button' ? '请选择菜单' : '根节点'}</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : null}

            {form.type !== 'button' ? (
              <FormField
                label="路径"
                required={form.type === 'menu'}
                error={fieldErrors.path}
              >
                <input
                  value={form.path}
                  onChange={(event) => updateForm({ path: event.target.value })}
                  className={inputClass}
                  placeholder="/system/users"
                />
              </FormField>
            ) : null}

            {form.type !== 'catalog' ? (
              <FormField
                label="权限码"
                required={form.type === 'button'}
                error={fieldErrors.perms}
                hint="全局唯一，例如 sys:user:add"
              >
                <input
                  value={form.perms}
                  onChange={(event) => updateForm({ perms: event.target.value })}
                  className={inputClass}
                  placeholder="sys:menu:add"
                />
              </FormField>
            ) : null}

            {form.type !== 'button' ? (
              <FormField label="图标">
                <input
                  value={form.icon}
                  onChange={(event) => updateForm({ icon: event.target.value })}
                  className={inputClass}
                  placeholder="Setting"
                />
              </FormField>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <FormField label="排序">
                <input
                  type="number"
                  value={form.sort}
                  onChange={(event) => updateForm({ sort: event.target.value })}
                  className={inputClass}
                />
              </FormField>
              <FormField label="状态">
                <select
                  value={form.status}
                  onChange={(event) => updateForm({ status: event.target.value })}
                  className={selectClass}
                >
                  <option value="1">启用</option>
                  <option value="0">停用</option>
                </select>
              </FormField>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除菜单"
        danger
        confirmText="删除"
        message={
          deleteTarget
            ? `确定删除「${deleteTarget.name}」吗？存在子节点或被角色引用时无法删除。`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
